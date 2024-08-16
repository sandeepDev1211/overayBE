import { model, Schema, Types } from "mongoose";

const DeviceTokenSchema = new Schema({
    user_id: {
        type: Types.ObjectId,
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
    platform: {
        type: String,
        required: true,
    },
});

export default model("device_token", DeviceTokenSchema);
