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
        get: (value) => value?.toISOString().split("T")[0], // safe optional chaining
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

// Create a partial unique index on 'phone' to ignore null values
userSchema.index(
    { phone: 1 },
    { unique: true, partialFilterExpression: { phone: { $exists: true, $ne: null } } }
);

export default model("user", userSchema);
