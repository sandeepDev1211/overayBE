import { Schema, model } from "mongoose";

const emailQueueSchema = new Schema({
    email_template: {
        type: String,
    },
    tags: {
        type: Object,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "sent", "failed"],
        default: "pending",
    },
    sentOn: {
        type: Date,
    },
    subject: {
        type: String,
        required: true,
    },
});

export default model("email_queue", emailQueueSchema);
