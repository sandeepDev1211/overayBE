import { Schema, Types, model } from "mongoose";

const productImageSchema = new Schema({
    product_id: {
        type: Types.ObjectId,
        required: true,
    },
    image_name: {
        type: String,
        required: true,
    },
});

export default model("product_img", productImageSchema);
