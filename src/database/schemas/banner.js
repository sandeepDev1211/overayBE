import mongoose from "mongoose";

const BannerSchema = new mongoose.Schema({
    image: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Banner", BannerSchema);
