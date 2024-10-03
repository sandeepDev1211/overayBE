import { Schema, model } from "mongoose";

const bannerSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    banner_image: {
        type: String,
        required: true,
    },
    banner_type: {
        type: String,
        required: true,
    },
    banner_url: {
        type: String,
    },
});

export default model("banner", bannerSchema);
