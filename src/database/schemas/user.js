import { Schema, Types, model } from "mongoose";

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
    },
    phone: {
        type: String,
    },
    dob: {
        type: Date,
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
});

export default model("user", userSchema);
