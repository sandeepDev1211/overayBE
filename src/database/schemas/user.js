import { Schema, model } from "mongoose";

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    dob: {
        type: Date,
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
        type: String,
    },
});

export default model("user", userSchema);
