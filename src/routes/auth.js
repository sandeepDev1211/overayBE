import { Router } from "express";
import schemas from "./schemas/index.js";
import auth from "../controllers/auth.js";
import jwtHelper from "../middleware/jwtHelper.js";
import utils from "../utils/index.js";
const app = Router();

app.post("/register", async (req, res) => {
    const user = req.body;
    const value = schemas.securityUserSchema.validate(user);
    if (value.error) return res.json({ error: value.error });
    const message = await auth.registerUser(user);
    if (message.error) {
        return res.json(message);
    }
    res.status(201).json({ message: "Created" });
});

app.post("/login", async (req, res) => {
    const loginData = req.body;
    const value = schemas.loginSchema.validate(loginData);
    if (value.error) return res.json({ error: value.error });
    const message = await auth.loginUser(loginData);
    res.json(message);
});

app.post(
    "/user/update",
    jwtHelper.verifyToken,
    utils.uploadFile.single("profileImage"),
    async (req, res) => {
        const user = req.body;
        const value = schemas.userSchema.validate(user);
        if (value.error) return res.json({ error: value.error });
        if (req.file) user.picture = req.file.filename;
        const message = await auth.updateUser(req.user._id, user);
        res.json(message);
    }
);

app.get("/user", jwtHelper.verifyToken, async (req, res) => {
    const user = await auth.getUser(req.user._id);
    res.json({ user });
});

export default app;
