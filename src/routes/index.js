import { Router } from "express";
import path from "path";
import auth from "./auth.js";
import checkout from "./checkout.js";
import order from "./order.js";
import jwtHelper from "../middleware/jwtHelper.js";
import banner from './banner.js'
const app = Router();


app.use("/auth", auth);
app.use("/banner",banner)
app.get("/file/:filename", (req, res) => {
    const filePath = path.join(
        path.resolve(),
        "src/uploads",
        req.params.filename
    );
    res.sendFile(filePath);
});
app.use("/checkout", jwtHelper.verifyToken, checkout);
app.use("/orders", jwtHelper.verifyToken, order);

export default app;
