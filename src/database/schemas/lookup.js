import { Schema, model } from "mongoose";

const lookupSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    lookup_type: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false,
    },
});

export default model("lookup", lookupSchema);
