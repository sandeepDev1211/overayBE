import { Schema, Types, model } from "mongoose";

const orderSchema = new Schema({
    user_id: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
    },
    products: [
        {
            product_id: {
                type: Types.ObjectId,
                ref: "product",
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
            },
            price: {
                type: Number,
                required: true,
            },
            discount: {
                type: Number,
                default: 0,
            },
            subtotal: {
                type: Number,
                default: 0,
            },
        },
    ],
    total_amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
        default: "Pending",
    },
    address: {
        type: Types.ObjectId,
        ref: "address",
        required: true,
    },
    courier_company_id: {
        type: Number,
        required: false, // Optional if using auto-assignment
    },
    awb: {
        type: String,
    },
    shipment_id: {
        type: Number,
    },
    courier_name: {
        type: String,
    },
    tracking_url: {
        type: String,
    },
    shipment_status: {
        type: String,
        default: "Created",
    },
    shipment_status_history: [
        {
            status: String,
            updated_at: Date,
            location: String,
            remarks: String,
        },
    ],
    coupon: {
        code: String,
        discount_amount: Number,
    },
    delivery_charges: {
        type: Number,
        default: 0,
    },
    sgst: {
        type: Number,
        default: 0,
    },
    cgst: {
        type: Number,
        default: 0,
    },
    razorpay_orderId: {
        type: String,
    },
    payment_method:{
        type: String,
 
    }
}, {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
});

export default model("order", orderSchema);
