import logger from "../../utils/logger.js";
import BusinessBase from "../business-base.js";
import schemas from "../../database/schemas/index.js";

class Category extends BusinessBase {
    Schema = schemas.category;
    async saveOrUpdate({ data, files = [] }) {
        try {
            const file = files[0];

            const { _id, ...updateData } =
                typeof data === "string" ? JSON.parse(data) : data;
            if (file) {
                updateData.image = file.filename;
            }
            let result;
            if (_id) {
                result = await this.Schema.findByIdAndUpdate(_id, updateData, {
                    new: true,
                    upsert: true,
                }).exec();
            } else {
                const newDocument = new this.Schema(updateData);
                result = await newDocument.save();
            }
            return result;
        } catch (error) {
            logger.error(error);
            return { error: error.toString() };
        }
    }
}

export default Category;
