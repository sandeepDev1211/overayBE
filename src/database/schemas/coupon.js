import { Schema, Types, model } from "mongoose";

const couponSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
    },
    discount_type: {
        type: String,
        enum: ["percentage", "fixed"],
        required: true,
    },
    discount_value: {
        type: Number,
        required: true,
        min: 0,
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
        min: 0,
    },
    max_discount_amount: {
        type: Number,
        required: false,
        min: 0,
    },
    applicable_products: [
        {
            type: Types.ObjectId,
            ref: "product",
        },
    ],
    applicable_categories: [
        {
            type: Types.ObjectId,
            ref: "category",
        },
    ],
    usage_limit: {
        type: Number,
        required: false,
        default: 1,
        min: 1,
    },
    used_count: {
        type: Number,
        required: false,
        default: 0,
        min: 0,
    },
    is_active: {
        type: Boolean,
        default: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
});

couponSchema.pre("save", function (next) {
    this.updated_at = new Date();
    next();
});

export default model("coupon", couponSchema);
