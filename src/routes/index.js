import { Router } from "express";
import path from "path";
import auth from "./auth.js";
const app = Router();

app.use("/auth", auth);
app.get("/file/:filename", (req, res) => {
    const filePath = path.join(
        path.resolve(),
        "src/uploads",
        req.params.filename
    );
    res.sendFile(filePath);
});

export default app;
