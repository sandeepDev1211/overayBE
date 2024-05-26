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
    Coupon: {
        Schema: schemas.coupon,
        keyField: "_id",
        populate: ["applicable_products", "applicable_categories"],
    },
    Order: {
        Schema: schemas.order,
        keyField: "_id",
        populate: ["products"],
    },
};

export default config;
