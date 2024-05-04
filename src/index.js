import Express from "express";
import version_1 from "./routes/index.js";
import databaseOperations from "./database/databaseOperations.js";

databaseOperations.createConnection();

const app = Express();

app.use(Express.json());

app.use("/v1", version_1);

app.listen(
    process.env.PORT,
    console.log(`Listening to port ${process.env.PORT}`)
);
