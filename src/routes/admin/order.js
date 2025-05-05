import { Router } from "express";
import schemas from "../../database/schemas/index.js";
import shiprocket from "../../utils/shiprocket.js";
import logger from "../../utils/logger.js";
const app = Router();
app.post("/create-shipment", async (req, res) => {
    try {
        const { order_id, height, weight, length, breadth } = req.body;

        // Fetch the order by its ID and populate related data (address, products)
        const order = await schemas.order
            .findById(order_id)
            .populate("address")
            .populate("products.product_id")
            .exec();

        if (!order) {
            return res.status(404).json({ message: "Order not found", error: true });
        }

        const isCOD = order.payment_method === "COD"; // Determine if payment is COD or Prepaid

        // Prepare the order details to send to Shiprocket
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
            payment_method: isCOD ? "COD" : "Prepaid",
            shipping_charges: 0,
            giftwrap_charges: 0,
            transaction_charges: 0,
            total_discount: 0,
            sub_total: order.total_amount,
            length,
            breadth,
            height,
            weight,
        };

        // Adding the order items from the products array
        orderDetail.order_items = order.products.map((product) => ({
            name: product.product_id.name,
            sku: product.product_id.sku,
            units: product.quantity,
            selling_price: product.price,
            discount: product.discount,
        }));

        // Call Shiprocket to create the order
        const response = await shiprocket.createOrder(orderDetail, order.courier_company_id);

        // Log the Shiprocket response for debugging
        console.log("Shiprocket Order Response: ", response);

        // Save the shipment information in the order model
        order.awb = response.awb_code || null;  // Track AWB (tracking number), could be empty
        order.shipment_id = response.shipment_id;
        order.courier_name = response.courier_name || '';  // Courier name (could be empty)
        order.tracking_url = response.tracking_url || '';  // URL for tracking (could be empty)
        order.shipment_status = "Created";  // Set status as 'Created' initially

        // Optionally, you can maintain a shipment status history for future tracking updates
        order.shipment_status_history.push({
            status: order.shipment_status,
            updated_at: new Date(),
            location: "Pickup Location",  // Replace with actual location if available
            remarks: "Shipment created successfully",
        });

        // Save the updated order document
        await order.save();

        // Respond to the client with success
        res.json({
            message: "Shipment created and assigned successfully",
            order,
        });

    } catch (err) {
        console.log("Error creating shipment:", err);
        logger.error("Create shipment error:", err);
        res.status(500).json({ message: "Something went wrong", error: true });
    }
});


export default app;
