import { model, Schema } from "mongoose";

const resetPasswordSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
});

resetPasswordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default model("reset_password", resetPasswordSchema);
