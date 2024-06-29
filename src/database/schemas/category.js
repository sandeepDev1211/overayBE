import { Schema, Types, model } from "mongoose";

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        required: false,
    },
    parent_category: {
        type: Types.ObjectId,
        required: false,
    },
    is_deleted: {
        type: Boolean,
        default: false,
    },
});

export default model("category", categorySchema);
