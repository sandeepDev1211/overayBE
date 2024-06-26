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
            type: Types.ObjectId,
            ref: "Product",
        },
    ],
});

export default model("cart", cartSchema);
