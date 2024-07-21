import { Schema, Types, model } from "mongoose";

const cartSchema = new Schema({
    user_id: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    products: [
        {
            productId: {
                type: Types.ObjectId,
                ref: "product",
            },
            quantity: {
                type: Number,
                default: 1,
            },
        },
    ],
});

export default model("cart", cartSchema);
