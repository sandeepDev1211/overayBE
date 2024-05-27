import { Router } from "express";
import businessBaseConfigs from "../../business/business-object-config.js";
import { classMap } from "../../business/business-base.js";
const app = Router();

for (const businessBaseConfigName in businessBaseConfigs) {
    classMap.register(
        businessBaseConfigName,
        businessBaseConfigs[businessBaseConfigName]
    );
}

app.use("/:businessObjectName", (req, res, next) => {
    const businessObjectName = req.params.businessObjectName
        .toUpperCase()
        .replaceAll("-", "");

    const constructor = classMap.get(businessObjectName);
    if (!constructor) {
        return res.sendStatus(404);
    }
    const businessObject = new constructor();
    businessObject.user = req.user;
    req.businessObject = businessObject;
    next();
});

app.post("/:businessObjectName/list", async (req, res) => {
    const { businessObject } = req;
    const { start, limit, sort, filter } = req.body;
    const data = await businessObject.list({ start, limit, sort, filter });
    return res.json(data);
});

app.post("/:businessObjectName/save", async (req, res) => {
    const { businessObject } = req;
    const { data } = req.body;
    const result = await businessObject.saveOrUpdate({ data });
    return res.json(result);
});

app.post("/:businessObjectName/delete", async (req, res) => {
    const { businessObject } = req;
    const { data } = req.body;
    const result = await businessObject.delete(data._id);
    return res.json(result);
});

app.get("/:businessObjectName/:id", async (req, res) => {
    const { businessObject } = req;
    const id = req.params.id;
    const result = await businessObject.load(id);
    return res.json(result);
});

export default app;
