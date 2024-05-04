import { Schema, model } from "mongoose";

const emailSchema = new Schema({
    templateName: {
        type: String,
        required: true,
    },
    tags: {
        type: String,
        required: true,
    },
    emailRecipients: {
        type: String,
        require: true,
    },
    tries: {
        type: Number,
        default: 0,
    },
    SentOn: {
        type: Date,
    },
});

export default model("email_queue", emailSchema);
