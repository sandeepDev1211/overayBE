import { Router } from "express";
import schemas from "../../database/schemas/index.js";
import shiprocket from "../../utils/shiprocket.js";
import logger from "../../utils/logger.js";
const app = Router();
app.post("/create-shipment", async (req, res) => {
    try {
        const { order_id, height, weight, length, breadth } = req.body;
        const order = await schemas.order
            .findById(order_id)
            .populate("address")
            .populate("products.product_id")
            .exec();
        if (!order)
            return res.json({ message: "Order not found", error: true });
        const orderDetail = {
            order_id: order._id,
            order_date: order.created_at,
            pickup_location: process.env.PRIMARY_PICKUP_NAME,
            billing_customer_name: order.address.name,
            billing_last_name: "",
            billing_address: order.address.address_line_1,
            billing_address_2: order.address.address_line_2,
            billing_city: order.address.city,
            billing_pincode: order.address.pincode,
            billing_state: order.address.state,
            billing_country: order.address.country,
            billing_email: order.address.email,
            billing_phone: order.address.phone_number,
            shipping_is_billing: true,
            payment_method: "Prepaid",
            shipping_charges: 0,
            giftwrap_charges: 0,
            transaction_charges: 0,
            total_discount: 0,
            sub_total: 9000,
            length: length,
            breadth: breadth,
            height: height,
            weight: weight,
        };
        orderDetail.order_items = order.products.map((product) => {
            const item = {
                name: product.product_id.name,
                sku: product.product_id.sku,
                units: product.quantity,
                selling_price: product.price,
                discount: product.discount,
            };
            return item;
        });
        const response = await shiprocket.createOrder(
            orderDetail,
            order.courier_company_id
        );
        order.awb = response.awb_code;
        res.json(order);
    } catch (err) {
        logger.error(err);
        res.json({ message: "Something went wrong", error: true });
    }
});
export default app;
