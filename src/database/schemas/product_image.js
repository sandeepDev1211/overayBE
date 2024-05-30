import { Schema, model } from "mongoose";

const productImageSchema = new Schema({
    product_id: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    imageName: {
        type: String,
        required: true,
    },
});

export default model("product_image", productImageSchema);
