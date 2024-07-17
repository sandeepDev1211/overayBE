import { Router } from "express";
import schemas from "../database/schemas/index.js";
import Razorpay from "razorpay";
import shiprocket from "../utils/shiprocket.js";
const app = Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZOR_PAY_KEY_ID,
    key_secret: process.env.RAZOR_PAY_KEY_SECRET,
});
app.post("/initiate", async (req, res) => {
    const { _id: userId } = req.user;
    const { products, address_id } = req.body;
    if (!products) return res.sendStatus(400);
    const productsIds = products.map((product) => product._id);
    const productDetails = await schemas.product.find({
        _id: { $in: productsIds },
    });

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
            (productDetail.price - productDetail.discount) * product.quantity;
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
    const razorpayOrder = await razorpay.orders.create({
        amount: totalAmount * 100,
        currency: "INR",
        receipt: "recipt#1",
        partial_payment: false,
    });
    const address = await schemas.address.findById(address_id);
    const delivery_pincode = address.pincode;
    const delivery_charges = await shiprocket.calculateShippingRate(
        delivery_pincode,
        totalWeight
    );
    const order = new schemas.order({
        user_id: userId,
        products: orderDetails,
        total_amount: totalAmount,
        status: "Pending",
        razorpay_orderId: razorpayOrder.id,
        delivery_charges,
        address: address_id,
    });
    res.send(await order.save());
});

app.post("/complete", async (req, res) => {
    const { paymentId, orderId } = req.body;
    const payment = await razorpay.payments.fetch(paymentId);
    if (payment.status !== "captured")
        return res.send({ message: "Payment not successful " });
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
