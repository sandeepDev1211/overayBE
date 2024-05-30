import { Router } from "express";
import businessBaseConfigs from "../../business/business-object-config.js";
import { classMap } from "../../business/business-base.js";
const app = Router();

/* This code snippet is iterating over each key in the `businessBaseConfigs` object using a `for...in`
loop. For each key (which represents a business base configuration name), it is calling the
`register` method of the `classMap` object. This method is used to register a business base
configuration by passing the configuration name as the first argument and the corresponding
configuration object from `businessBaseConfigs` as the second argument. This allows the `classMap`
to store and map business base configurations for later use in the application. */
for (const businessBaseConfigName in businessBaseConfigs) {
    classMap.register(
        businessBaseConfigName,
        businessBaseConfigs[businessBaseConfigName]
    );
}

/* This code snippet is defining a middleware function using `app.use` in an Express application. The
middleware function is executed for every request that matches the specified route pattern
`/:businessObjectName`. */
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
    const { start, limit, sort, filter = {} } = req.body;
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
