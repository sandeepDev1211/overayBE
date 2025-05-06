import multer from "multer";
import path from "path";
import schemas from "../database/schemas/index.js";
import fs from "fs";
import banner from "../database/schemas/banner.js";
import { Router } from "express";
const app = Router();
const attachmentPath = path.join("src", "uploads");
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, attachmentPath);
    },
    filename: (req, file, cb) => {
        const uploadSuffix = Date.now() + "-" + Math.round(Math.random() * 1000);
        cb(null, uploadSuffix + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

app.post("/upload-banner", upload.single("image"), async (req, res) => {
    try {

        const filePath = `${req.file.filename}`;
        const banner = await schemas.banner.create({ image: filePath });
        res.status(201).json({ message: "Banner uploaded", banner });
    } catch (err) {
        res.status(500).json({ message: "Banner upload failed", error: err.message });
    }
});

// GET /banners
app.post("/banners", async (req, res) => {
    try {
        const banners = await schemas.banner.find().sort({ createdAt: -1 });
        res.json(banners);
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Failed to fetch banners", error: err.message });
    }
});

// DELETE /banner/:id
app.post("/banner/:id", async (req, res) => {
    try {
        const banner = await schemas.banner.findByIdAndDelete(req.params.id);
        if (!banner) return res.status(404).json({ message: "Banner not found" });

        const fullPath = path.join("src", banner.image);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

        res.json({ message: "Banner deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete banner", error: err.message });
    }
});

export default app;
