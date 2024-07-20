import { Schema, Types, model } from "mongoose";
import product from "./product.js";
import logger from "../../utils/logger.js";

const productReviewSchema = new Schema({
    user_id: {
        type: Types.ObjectId,
        required: true,
        ref: "user",
    },
    review: {
        type: String,
        required: true,
    },
    score: {
        type: Number,
        required: true,
        default: 1,
    },
    product_id: {
        type: Types.ObjectId,
        required: true,
    },
});

productReviewSchema.post("save", (doc, next) => {
    try {
        product
            .findByIdAndUpdate(doc.product_id, {
                $push: { reviews: doc._id },
            })
            .exec();
        next();
    } catch (err) {
        logger.error(err);
    }
});

productReviewSchema.post("findOneAndDelete", (doc, next) => {
    product.findByIdAndUpdate(doc.product_id, {
        $pull: { product_images: doc._id },
    });
    next();
});

export default model("product_review", productReviewSchema);
