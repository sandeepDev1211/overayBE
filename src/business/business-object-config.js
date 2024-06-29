import schemas from "../database/schemas/index.js";
import ProductImage from "./overrides/product-image.js";
import Product from "./overrides/product.js";

const config = {
    Product: Product,
    Category: {
        Schema: schemas.category,
        keyField: "_id",
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
    ProductImage: ProductImage,
};

export default config;
