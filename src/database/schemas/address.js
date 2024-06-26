import { Schema, model, Types } from "mongoose";

const addressSchema = new Schema({
    address_line_1: String,
    address_line_2: String,
    landmark: String,
    pincode: Number,
    user_id: {
        type: Types.ObjectId,
        required: true,
    },
});

export default model("address", addressSchema);
