import { Schema, Types, model } from "mongoose";

const couponSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
    },
    discount_type: {
        type: String,
        enum: ["percentage", "fixed"],
        required: true,
    },
    discount_value: {
        type: Number,
        required: true,
    },
    valid_from: {
        type: Date,
        required: true,
    },
    valid_until: {
        type: Date,
        required: true,
    },
    min_order_amount: {
        type: Number,
        required: false,
    },
    applicable_products: [
        {
            type: Types.ObjectId,
            ref: "Product",
            required: false,
        },
    ],
    applicable_categories: [
        {
            type: Types.ObjectId,
            ref: "Category",
            required: false,
        },
    ],
    usage_limit: {
        type: Number,
        required: false,
        default: 1,
    },
    used_count: {
        type: Number,
        required: false,
        default: 0,
    },
    is_active: {
        type: Boolean,
        default: true,
    },
});

export default model("coupon", couponSchema);
