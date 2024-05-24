import schemas from "../database/schemas/index.js";

const config = {
    Product: {
        Schema: schemas.product,
        keyField: "code",
        lookups: [],
    },
};

export default config;
