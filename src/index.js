import Express from "express";
import version_1 from "./routes/index.js";
import databaseOperations from "./database/databaseOperations.js";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import http from "http";
import { typeDefs } from "./graphql/typeDefs.js";
import { resolvers } from "./graphql/resolvers.js";
import jwtHelper from "./middleware/jwtHelper.js";

(async () => {
    databaseOperations.createConnection();

    const app = Express();

    const httpServer = http.createServer(app);

    const apolloServer = new ApolloServer({
        typeDefs,
        resolvers,
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    });

    await apolloServer.start();

    app.use(Express.json());

    app.use("/v1", version_1);

    app.use(
        "/v1/graphql",
        Express.json(),
        jwtHelper.verifyToken,
        expressMiddleware(apolloServer, {
            context: async ({ req }) => ({ user: req.user }),
        })
    );

    app.listen(
        process.env.PORT,
        console.log(`Listening to port ${process.env.PORT}`)
    );
})();
