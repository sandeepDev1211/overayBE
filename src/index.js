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
        jwtHelper.verifyToken,
        expressMiddleware(apolloServer, {
            context: async ({ req }) => ({ user: req.user }),
        })
    );
    app.use("/v1/admin", jwtHelper.verifyAdminToken, admin);
    shiprocket.initialize();
    app.listen(
        process.env.PORT,
        console.log(`Listening to port ${process.env.PORT}`)
    );
})();
