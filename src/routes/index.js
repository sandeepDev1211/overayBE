import { Router } from "express";
import auth from "./auth.js";
const app = Router();

app.use("/auth", auth);

export default app;
