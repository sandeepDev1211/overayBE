import { Router } from "express";
import schemas from "../database/schemas/index.js";

const app = Router();

app.post("/list", async (req, res) => {
    const { start = 0, limit = 50, sort = {}, filter = {} } = req.body;
    filter.user_id = req.user._id;
    const orders = await schemas.order
        .find(filter)
        .sort(sort)
        .skip(start)
        .limit(limit)
        .exec();
    res.json(orders);
});

app.get("/:id", async (req, res) => {
    const id = req.params.id;
    const order = await schemas.order
        .findById(id)
        .populate("products.product_id")
        .populate("address")
        .exec();
    res.json(order);
});

export default app;
