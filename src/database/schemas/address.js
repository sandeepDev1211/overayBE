import { Schema, model, Types } from "mongoose";

const addressSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    address_line_1: {
        type: String,
        required: true,
    },
    address_line_2: {
        type: String,
        required: true,
    },
    landmark: {
        type: String,
        required: true,
    },
    pincode: {
        type: Number,
        required: true,
    },
    user_id: {
        type: Types.ObjectId,
        required: true,
    },
});

export default model("address", addressSchema);
