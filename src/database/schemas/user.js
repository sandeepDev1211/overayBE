import { Schema, Types, model } from "mongoose";

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
        type: Types.ObjectId,
        required: true,
    },
});

export default model("user", userSchema);
