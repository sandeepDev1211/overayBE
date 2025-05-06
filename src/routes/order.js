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

app.get("/analytics/summary", async (req, res) => {
    try {
        const stats = await schemas.order.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$total_amount" },
                    totalOrders: { $sum: 1 },
                    avgOrderValue: { $avg: "$total_amount" },
                },
            },
        ]);

        const statusCounts = await schemas.order.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);

        const monthlyRevenue = await schemas.order.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$created_at" },
                        month: { $month: "$created_at" },
                    },
                    revenue: { $sum: "$total_amount" },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]);

        // Format the numbers to two decimal places
        const formattedStats = stats[0] || {
            totalRevenue: 0,
            totalOrders: 0,
            avgOrderValue: 0,
        };
        
        formattedStats.totalRevenue = parseFloat(formattedStats.totalRevenue).toFixed(2);
        formattedStats.avgOrderValue = parseFloat(formattedStats.avgOrderValue).toFixed(2);

        // Format status breakdown (although it's counts, it won't need decimals)
        const formattedStatusCounts = statusCounts.map(status => ({
            _id: status._id,
            count: status.count,
        }));

        // Format monthly revenue
        const formattedMonthlyRevenue = monthlyRevenue.map(month => ({
            ...month,
            revenue: parseFloat(month.revenue).toFixed(2),
            orders: month.orders,
        }));

        res.json({
            summary: formattedStats,
            statusBreakdown: formattedStatusCounts,
            monthlyRevenue: formattedMonthlyRevenue,
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to get analytics", details: err.message });
    }
});



export default app;
