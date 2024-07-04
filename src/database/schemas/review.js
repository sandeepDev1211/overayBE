import { Schema, Types, model } from "mongoose";

const reviewSchema = new Schema({
    product_id: {
        type: Types.ObjectId,
        required: true,
    },
    comments: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        required: true,
    },
});

export default model("review", reviewSchema);
