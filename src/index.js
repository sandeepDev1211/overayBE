import Express from "express";
import cors from "cors";
import version_1 from "./routes/index.js";
import databaseOperations from "./database/databaseOperations.js";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import http from "http";
import { typeDefs } from "./graphql/typeDefs.js";
import { resolvers } from "./graphql/resolvers.js";
import jwtHelper from "./middleware/jwtHelper.js";
import admin from "./routes/admin/index.js";
import shiprocket from "./utils/shiprocket.js";
import processEmail from "./mail-sender.js";
import cron from "node-cron";
import notification from "./routes/notification.js";
import logger from "./utils/logger.js";

(async () => {
    databaseOperations.createConnection();

    const app = Express();
    app.use(cors());
    const httpServer = http.createServer(app);

    const apolloServer = new ApolloServer({
        typeDefs,
        resolvers,
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    });

    await apolloServer.start();

    app.use(Express.json());

    app.use((err, req, res, next) => {
        logger.error(err);
        res.status(500).json({
            message:
                "Something went wrong, Please check request or contact system admin!!",
        });
    });

    app.use("/v1", version_1);

    app.use(
        "/v1/graphql",
        Express.json(),
        expressMiddleware(apolloServer, {
            context: async ({ req }) => {
                const user = jwtHelper.verifyGraphqlToken(req);
                return { user };
            },
        })
    );
    app.use("/v1/admin", jwtHelper.verifyAdminToken, admin);
    app.use("/v1/notification", notification);
    shiprocket.initialize();
    const task = cron.schedule("* * * * *", processEmail);
    task.start();
    app.listen(
        process.env.PORT,
        console.log(`Listening to port ${process.env.PORT}`)
    );
    process.on("uncaughtException", (err) => {
        logger.error(err);
    });
})();
