import { Router } from "express";
import schemas from "../database/schemas/index.js";

const app = Router();

app.post("/register", (req, res) => {
    const { userId, token } = req.body;
    const deviceToken = new schemas.device_token({
        user_id: userId,
        token: token,
        platform: "android",
    });
    deviceToken.save();
});

export default app;
