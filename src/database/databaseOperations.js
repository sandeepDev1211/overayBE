import mongoose from "mongoose";

const createConnection = () => {
    mongoose
        .connect(process.env.DB_URL, {
            dbName: process.env.DB_NAME,
            maxPoolSize: 100,
        })
        .then(console.log("Database Connected"))
        .catch(console.error);
};

export default { createConnection };
