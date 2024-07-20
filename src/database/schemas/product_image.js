import { Schema, Types, model } from "mongoose";
import logger from "../../utils/logger.js";
import product from "./product.js";

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

productImageSchema.post("save", (doc, next) => {
    try {
        product
            .findByIdAndUpdate(doc.product_id, {
                $push: { product_images: doc._id },
            })
            .exec();
        next();
    } catch (error) {
        logger.error(error);
    }
});

productImageSchema.post("findOneAndDelete", (doc, next) => {
    product.findByIdAndUpdate(doc.product_id, {
        $pull: { product_images: doc._id },
    });
    next();
});
export default model("product_img", productImageSchema);
