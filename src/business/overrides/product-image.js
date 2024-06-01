import logger from "../../utils/logger.js";
import BusinessBase from "../business-base.js";
import schemas from "../../database/schemas/index.js";
class ProductImage extends BusinessBase {
    Schema = schemas.product_image;
    async saveOrUpdate({ data, files = [] }) {
        if (files.length === 0) {
            throw new Error("File is required for saving product image");
        }
        try {
            // Convert data to JSON once outside the loop
            const parsedData = JSON.parse(data);

            // Map files to promises
            const promises = files.map((file) => {
                const newDocument = new this.Schema({
                    image_name: file.filename,
                    ...parsedData,
                });
                return newDocument.save();
            });

            // Wait for all promises to complete
            const result = await Promise.all(promises);
            return result;
        } catch (error) {
            logger.error(error);
            return { error: error.toString() };
        }
    }
}

export default ProductImage;
