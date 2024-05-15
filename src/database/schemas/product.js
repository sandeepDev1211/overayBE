import { Schema, model } from "mongoose";

const productSchema = new Schema({
    name: {
        type: String,
        require: true,
    },
    code: {
        type: String,
        require: true,
        unique: true,
    },
    price: {
        type: Number,
        require: true,
    },
    discount: {
        type: Number,
        require: true,
    },
});

export default model("product", productSchema);
