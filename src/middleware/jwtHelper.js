import jwt from "jsonwebtoken";
import schemas from "../database/schemas/index.js";

const createToken = (user) => {
    const token = jwt.sign({ user }, process.env.JWT_SECRET, {
        expiresIn: "1y",
    });
    return token;
};

const createVerificationToken = (email) => {
    const token = jwt.sign({ email }, process.env.JWT_SECRET_VERIFICATION, {
        expiresIn: "1d",
    });
    return token;
};

const verifyVerificationToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_VERIFICATION);
        return decoded;
    } catch (err) {
        return null;
    }
};

const verifyToken = async (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).send("Unauthorized request");
    }
    const token = req.headers["authorization"].split(" ")[1];
    if (!token) {
        return res.status(401).send("Access denied. No token provided.");
    }
    try {
        const existingTokens = await schemas.blocked_token.find({
            token: token,
        });
        if (existingTokens.length > 0) {
            return res.status(401).send("Access denied. Invalid token.");
        }
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

const verifyAdminToken = async (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).send("Unauthorized request");
    }
    const token = req.headers["authorization"].split(" ")[1];
    if (!token) {
        return res.status(401).send("Access denied. No token provided.");
    }
    try {
        const existingTokens = await schemas.blocked_token.find({
            token: token,
        });
        if (existingTokens.length > 0) {
            return res.status(401).send("Access denied. Invalid token.");
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.user.isInternal)
            return res.status(401).send("Unauthorized request");
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
    createVerificationToken,
    verifyVerificationToken,
};
