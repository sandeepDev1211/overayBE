import { Schema, Types, model } from "mongoose";

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    dob: {
        type: Date,
        required: true,
        get: (value) => value.toISOString().split("T")[0], // Getter to ensure date-only format
        set: (value) => new Date(value),
    },
    address: {
        type: String,
    },
    gender: {
        type: String,
    },
    picture: {
        type: String,
    },
    security_userId: {
        type: Types.ObjectId,
        required: true,
    },
});

export default model("user", userSchema);
