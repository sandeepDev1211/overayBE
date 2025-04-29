import { Router } from "express";
import schemas from "../database/schemas/index.js";
import Razorpay from "razorpay";
import shiprocket from "../utils/shiprocket.js";
import logger from "../utils/logger.js";
const app = Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZOR_PAY_KEY_ID,
    key_secret: process.env.RAZOR_PAY_KEY_SECRET,
});
app.post("/initiate", async (req, res) => {
    try {
        const { _id: userId } = req.user;
        const { products, address_id, coupon_code, isCOD } = req.body;
        if (!products) return res.sendStatus(400);
        const productsIds = products.map((product) => product._id);
        const productDetails = await schemas.product.find({
            _id: { $in: productsIds },
        });
        if (productDetails.length !== products.length)
            return res.status(400).send({ error: "Invalid product ids" });

        let totalAmount = 0;
        let totalWeight = 0;
        let orderDetails = [];

        for (const product of products) {
            const productDetail = productDetails.find(
                (p) => p._id.toString() === product._id
            );
            if (!productDetail) continue;
            if (product.quantity > productDetail.quantity)
                return res.send({
                    error: `Insufficient quantity for product ${productDetail.name}`,
                });

            totalAmount +=
                (productDetail.price - productDetail.discount) *
                product.quantity;
            totalWeight += productDetail.weight * product.quantity;
            orderDetails.push({
                product_id: productDetail._id,
                price: productDetail.price,
                discount: productDetail.discount,
                quantity: product.quantity,
                subtotal:
                    (productDetail.price - productDetail.discount) *
                    product.quantity,
            });
        }
        const address = await schemas.address.findById(address_id);
        const delivery_pincode = address.pincode;
        const delivery_charges = await shiprocket.calculateShippingRate(
            delivery_pincode,
            totalWeight / 1000
        );
        let appliedCoupon = null;
        if (coupon_code) {
            appliedCoupon = await schemas.coupon.findOne({
                code: coupon_code.toUpperCase(),
                is_active: true,
                valid_from: { $lte: new Date() },
                valid_until: { $gte: new Date() },
                $expr: { $lt: ["$used_count", "$usage_limit"] },
            });

            if (appliedCoupon) {
                if (totalAmount >= (appliedCoupon.min_order_amount || 0)) {
                    let discountAmount = 0;
                    if (appliedCoupon.discount_type === "percentage") {
                        discountAmount =
                            totalAmount * (appliedCoupon.discount_value / 100);
                        if (appliedCoupon.max_discount_amount) {
                            discountAmount = Math.min(
                                discountAmount,
                                appliedCoupon.max_discount_amount
                            );
                        }
                    } else if (appliedCoupon.discount_type === "fixed") {
                        discountAmount = appliedCoupon.discount_value;
                    } else if (
                        appliedCoupon.discount_type === "free_shipping"
                    ) {
                        delivery_charges.rate = 0;
                    } else if (appliedCoupon.discount_type === "first-time") {
                        const orderCount = await schemas.order.countDocuments({
                            user_id: userId,
                        });
                        if (orderCount === 0) {
                            discountAmount = coupon.discount_value;
                        } else {
                            throw new Error(
                                "This coupon is only valid for first-time purchases"
                            );
                        }
                    }
                    totalAmount -= discountAmount;
                    totalAmount = Math.max(totalAmount, 0);
                } else {
                    return res.status(400).send({
                        error: "Minimum order amount not met for this coupon",
                    });
                }
            } else {
                return res
                    .status(400)
                    .send({ error: "Invalid or expired coupon" });
            }
        }

        totalAmount += delivery_charges.rate;

        const taxRate = 0.05;
        const sgst = totalAmount * taxRate;
        const cgst = totalAmount * taxRate;
        totalAmount += sgst + cgst;
        let razorpayOrder;
        if (!isCOD) {
            razorpayOrder = await razorpay.orders.create({
                amount: Math.round(Number((totalAmount * 100).toFixed(2)) * 10),
                currency: "INR",
                receipt: "recipt#1",
                partial_payment: false,
            });
        }

        const order = await new schemas.order({
            user_id: userId,
            products: orderDetails,
            total_amount: totalAmount,
            status: isCOD ? "Processing" : "Pending",
            razorpay_orderId: isCOD ? null : razorpayOrder.id,
            delivery_charges: delivery_charges.rate,
            courier_company_id: delivery_charges.courier_company_id,
            address: address_id,
            coupon: appliedCoupon
                ? {
                      code: appliedCoupon.code,
                      discount_amount: appliedCoupon.discount_value,
                  }
                : null,
            cgst: cgst,
            sgst: sgst,
        }).save();
        if (isCOD) {
            for (const product of order.products) {
                schemas.product.updateOne(
                    { _id: product.product_id },
                    { $inc: { quantity: -product.quantity } }
                );
            }
        }
        res.send(await order.save());
    } catch (err) {
        logger.error(err);
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
export default app;
