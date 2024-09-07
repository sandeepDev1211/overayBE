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
        const { products, address_id, coupon_code } = req.body;
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
        totalAmount += delivery_charges.rate;

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
                    } else {
                        discountAmount = appliedCoupon.discount_value;
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

        const taxRate = 0.05;
        const sgst = totalAmount * taxRate;
        const cgst = totalAmount * taxRate;
        totalAmount += sgst + cgst;

        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(Number((totalAmount * 100).toFixed(2)) * 10),
            currency: "INR",
            receipt: "recipt#1",
            partial_payment: false,
        });

        const order = new schemas.order({
            user_id: userId,
            products: orderDetails,
            total_amount: totalAmount,
            status: "Pending",
            razorpay_orderId: razorpayOrder.id,
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
        });
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
export default app;
