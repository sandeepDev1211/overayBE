import { Router } from "express";
import schemas from "./schemas/index.js";
import auth from "../controllers/auth.js";
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

export default app;
