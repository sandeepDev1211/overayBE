import { Router } from "express";
import schemas from "../database/schemas/index.js";
import Razorpay from "razorpay";
import shiprocket from "../utils/shiprocket.js";
import logger from "../utils/logger.js";
import axios from "axios";

const app = Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZOR_PAY_KEY_ID,
    key_secret: process.env.RAZOR_PAY_KEY_SECRET,
});
app.post("/initiate", async (req, res) => {
    try {
        const { _id: userId } = req.user;
        const { products, address_id, coupon_code, isCOD } = req.body;

        console.log("📦 Products:", products);
        console.log("📍 Address ID:", address_id);
        console.log("🏷️ Coupon Code:", coupon_code);
        console.log("💵 isCOD:", isCOD);

        if (!products) {
            console.log("❌ Missing products");
            return res.sendStatus(400);
        }

        const productsIds = products.map((product) => product._id);
        const productDetails = await schemas.product.find({
            _id: { $in: productsIds },
        });

        console.log("🔍 Fetched product details:", productDetails);

        if (productDetails.length !== products.length) {
            console.log("❌ Invalid product IDs");
            return res.status(400).send({ error: "Invalid product ids" });
        }

        let totalAmount = 0;
        let totalWeight = 0;
        let orderDetails = [];

        for (const product of products) {
            const productDetail = productDetails.find(
                (p) => p._id.toString() === product._id
            );
            if (!productDetail) continue;

            if (product.quantity > productDetail.quantity) {
                console.log(`❌ Insufficient quantity for product ${productDetail.name}`);
                return res.send({
                    error: `Insufficient quantity for product ${productDetail.name}`,
                });
            }

            const subtotal = (productDetail.price - productDetail.discount) * product.quantity;
            totalAmount += subtotal;
            totalWeight += productDetail.weight * product.quantity;

            orderDetails.push({
                product_id: productDetail._id,
                price: productDetail.price,
                discount: productDetail.discount,
                quantity: product.quantity,
                subtotal,
            });
        }

        console.log("🧾 Order details computed:", orderDetails);
        console.log("💰 Total amount:", totalAmount);
        console.log("⚖️ Total weight (g):", totalWeight);

        const address = await schemas.address.findById(address_id);
        if (!address) {
            console.log("❌ Address not found");
            return res.status(400).send({ error: "Invalid address ID" });
        }

        const delivery_pincode = address.pincode;
        console.log("📦 Delivery pincode:", delivery_pincode);

        const delivery_charges = await shiprocket.calculateShippingRate(
            delivery_pincode,
            totalWeight / 1000
        );
        console.log("🚚 Delivery charges:", delivery_charges);

        let appliedCoupon = null;

        if (coupon_code) {
            console.log("🎟️ Checking coupon validity...");

            appliedCoupon = await schemas.coupon.findOne({
                code: coupon_code.toUpperCase(),
                is_active: true,
                valid_from: { $lte: new Date() },
                valid_until: { $gte: new Date() },
                $expr: { $lt: ["$used_count", "$usage_limit"] },
            });

            if (appliedCoupon) {
                console.log("✅ Valid coupon found:", appliedCoupon);

                if (totalAmount >= (appliedCoupon.min_order_amount || 0)) {
                    let discountAmount = 0;

                    if (appliedCoupon.discount_type === "percentage") {
                        discountAmount = totalAmount * (appliedCoupon.discount_value / 100);
                        if (appliedCoupon.max_discount_amount) {
                            discountAmount = Math.min(
                                discountAmount,
                                appliedCoupon.max_discount_amount
                            );
                        }
                    } else if (appliedCoupon.discount_type === "fixed") {
                        discountAmount = appliedCoupon.discount_value;
                    } else if (appliedCoupon.discount_type === "free_shipping") {
                        delivery_charges.rate = 0;
                    } else if (appliedCoupon.discount_type === "first-time") {
                        const orderCount = await schemas.order.countDocuments({
                            user_id: userId,
                        });
                        if (orderCount === 0) {
                            discountAmount = appliedCoupon.discount_value;
                        } else {
                            console.log("❌ Coupon not valid for returning customer");
                            throw new Error("This coupon is only valid for first-time purchases");
                        }
                    }

                    console.log("💸 Discount amount applied:", discountAmount);
                    totalAmount -= discountAmount;
                    totalAmount = Math.max(totalAmount, 0);
                } else {
                    console.log("❌ Minimum order not met for coupon");
                    return res.status(400).send({
                        error: "Minimum order amount not met for this coupon",
                    });
                }
            } else {
                console.log("❌ Invalid or expired coupon");
                return res.status(400).send({ error: "Invalid or expired coupon" });
            }
        }

        totalAmount += delivery_charges.rate;
        console.log("🚚 Added delivery charges. New total:", totalAmount);

        const taxRate = 0.05;
        const sgst = totalAmount * taxRate;
        const cgst = totalAmount * taxRate;
        totalAmount += sgst + cgst;

        console.log("🧾 Tax (SGST + CGST):", sgst + cgst);
        console.log("📦 Final total amount:", totalAmount);

        let razorpayOrder;
        if (!isCOD) {
            console.log("🔧 Creating Razorpay order...");
            razorpayOrder = await razorpay.orders.create({
                amount: Math.round(Number((totalAmount * 100).toFixed(2)) * 10),
                currency: "INR",
                receipt: "recipt#1",
                partial_payment: false,
            });
            console.log("🧾 Razorpay order created:", razorpayOrder.id);
        }

        const order = await new schemas.order({
            user_id: userId,
            products: orderDetails,
            total_amount: totalAmount,
            status: isCOD ? "Processing" : "Pending",
            razorpay_orderId: isCOD ? null : razorpayOrder.id,
            payment_method: isCOD ? "COD" : "Prepaid",
            delivery_charges: delivery_charges.rate,
            courier_company_id: delivery_charges.courier_company_id,
            address: address_id,
            coupon: appliedCoupon
                ? {
                      code: appliedCoupon.code,
                      discount_amount: appliedCoupon.discount_value,
                  }
                : null,
            cgst,
            sgst,
        }).save();

        console.log("✅ Order saved:", order._id);

        if (isCOD) {
            console.log("📦 COD order, updating product stock...");
            for (const product of order.products) {
                await schemas.product.updateOne(
                    { _id: product.product_id },
                    { $inc: { quantity: -product.quantity } }
                );
            }
            console.log("✅ Stock updated");
        }

        return res.send(order);
    } catch (error) {
        console.error("❌ Error during /initiate:", error);
        logger.error(error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});



app.post("/complete", async (req, res) => {
    const { paymentId, orderId } = req.body;
    const payment = await razorpay.payments
        .fetch(paymentId)
        .catch((err) => logger.error(err));
    if (!payment || payment.status !== "captured")
        return res.send({ message: "Payment not successful" });
    const order = await schemas.order.findOne({ razorpay_orderId: orderId });
    for (const product of order.products) {
        schemas.product.updateOne(
            { _id: product.product_id },
            { $inc: { quantity: -product.quantity } }
        );
    }
    order.status = "Processing";
    order.save();
    res.send(order);
});

app.post("/get-expected-delivery", async (req, res) => {
    try {
        // Extract data from the request body
        const {  deliveryPinCode, weight } = req.body;
        const pickupPinCode = 226022;
        // Validate request data
        if (!pickupPinCode || !deliveryPinCode || !weight) {
            return res.status(400).json({ error: "All fields (pickupPinCode, deliveryPinCode, weight) are required." });
        }

        console.log("Fetching expected delivery date...");

        // Call Shiprocket to get the expected delivery date
        const expectedDelivery = await shiprocket.getExpectedDeliveryDate(pickupPinCode, deliveryPinCode, weight);

        if (expectedDelivery) {
            console.log("Expected Delivery Date:", expectedDelivery);
            res.json({ expectedDeliveryDate: expectedDelivery });
        } else {
            res.status(404).json({ error: "Could not retrieve expected delivery date Kindly check your pincode." });
        }
    } catch (error) {
        console.error("Error fetching expected delivery date:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/get-pincode-details", async (req, res) => {
    console.log("nqlwiioqwio")
    const { pincode } = req.query;
    console.log("nqlwiioqwio",pincode)
  
    if (!pincode) {
      return res.status(400).json({ error: "Pincode is required in query params." });
    }
  
    try {
      const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = response.data[0];
  console.log("nooowow===",data)
      if (data.Status === "Success" && data.PostOffice && data.PostOffice.length > 0) {
        const postOffice = data.PostOffice[0];
        return res.json({
          pincode: pincode,
          city: postOffice.District,
          state: postOffice.State,
          country: postOffice.Country || "India",
        });
      } else {
        return res.status(404).json({ error: "Invalid pincode or data not found." });
      }
    } catch (err) {
      console.error("Error fetching data:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });
export default app;
