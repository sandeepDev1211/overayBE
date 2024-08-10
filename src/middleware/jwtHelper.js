import { ApolloServerErrorCode } from "@apollo/server/errors";
import jwt from "jsonwebtoken";

const createToken = (user) => {
    const token = jwt.sign({ user }, process.env.JWT_SECRET, {
        expiresIn: "1y",
    });
    return token;
};

const verifyToken = (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).send("Unauthorized request");
    }
    const token = req.headers["authorization"].split(" ")[1];
    if (!token) {
        return res.status(401).send("Access denied. No token provided.");
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(400).send("Invalid token.");
    }
};

const verifyGraphqlToken = (req) => {
    let user = null;
    if (req.headers.authorization) {
        const token = req.headers["authorization"].split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = decoded.user;
    }
    return user;
};

const verifyAdminToken = (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).send("Unauthorized request");
    }
    const token = req.headers["authorization"].split(" ")[1];
    if (!token) {
        return res.status(401).send("Access denied. No token provided.");
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.user.isInternal) throw "Unauthorised";
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).send("Unauthorised");
    }
};

export default {
    createToken,
    verifyToken,
    verifyAdminToken,
    verifyGraphqlToken,
};
