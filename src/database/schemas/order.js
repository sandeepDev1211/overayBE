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
                required: false,
                default: 0,
            },
            subtotal: {
                type: Number,
                required: false,
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
    delivery_charges: {
        type: Number,
        required: true,
        default: 0,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    sgst: {
        type: Number,
        default: 0,
    },
    cgst: {
        type: Number,
        default: 0,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
    razorpay_orderId: {
        type: String,
    },
});

export default model("order", orderSchema);
