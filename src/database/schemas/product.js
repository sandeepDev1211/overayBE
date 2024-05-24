import { Schema, Types, model } from "mongoose";

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
    parent_id: {
        type: Types.ObjectId,
    },
    categories: {
        type: Array.of(Types.ObjectId),
        require: true,
    },
});

export default model("product", productSchema);
