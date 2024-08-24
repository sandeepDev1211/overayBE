import { model, Schema } from "mongoose";

const blockedTokenSchema = new Schema({
    token: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        default: Date.now,
        index: { expires: "30d" },
    },
});

export default model("blocked_token", blockedTokenSchema);
