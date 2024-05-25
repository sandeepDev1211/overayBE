import schemas from "../database/schemas/index.js";

const config = {
    Product: {
        Schema: schemas.product,
        keyField: "code",
        populate: ["categories"],
    },
    Category: {
        Schema: schemas.category,
        keyField: "_id",
        populate: ["parent_category"],
    },
};

export default config;
