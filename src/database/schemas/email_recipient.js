import { Schema, Types, model } from "mongoose";

const emailRecipientSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    email_queue_id: {
        type: Types.ObjectId,
    },
});

export default model("email_recipient", emailRecipientSchema);
