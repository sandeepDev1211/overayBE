import { Router } from "express";
import schemas from "./schemas/index.js";
import auth from "../controllers/auth.js";
import jwtHelper from "../middleware/jwtHelper.js";
import utils from "../utils/index.js";
import { OAuth2Client } from "google-auth-library";
import logger from "../utils/logger.js";
import security_user from "../database/schemas/security_user.js";

const app = Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post("/register", async (req, res) => {
    const user = req.body;
    const value = schemas.securityUserSchema.validate(user);
    if (value.error) return res.json({ error: value.error });
    const message = await auth.registerUser(user);
    if (message.error) {
        return res.json(message);
    }
    res.status(201).json({ message: "Created" });
});

app.post("/register/google", async (req, res) => {
    try {
        const { token, email, phoneNumber } = req.body;
console.log(req.body);
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (payload.email !== email) {
            return res.status(400).json({ error: true, message: "Invalid email" });
        }

        const result = await auth.registerWithGoogle({
            email,
            phoneNumber,
            name: payload.name,
        });

        const user = await security_user.findOne({ email });

        if (user) {
            const jwt = jwtHelper.createToken(user);
console.log("now user found",jwt); 
            return res.json({ ...result, token: jwt });
        }

console.log("here");
        return res.status(400).json({ error: true, message: "Registration failed" });
    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(500).json({ error: true, message: "Authentication failed" });
    }
});
app.post("/login", async (req, res) => {
    const loginData = req.body;
    const value = schemas.loginSchema.validate(loginData);
    if (value.error) return res.json({ error: value.error });
    const message = await auth.loginUser(loginData);
    res.json(message);
});

app.post("/login/google", async (req, res) => {
    const { token } = req.body;
    const ticket = await client
        .verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        })
        .catch((error) => {
            logger.error(error);
            return res.json({ error: "Invalid token" });
        });
    if (!token) {
        return res.json({ error: "Invalid token" });
    }
    const message = await auth.loginWithGoogle(ticket.getPayload().email);
    res.json(message);
});

app.post("/login/phone", async (req, res) => {
    const { phoneNumber } = req.body;
    const message = await auth.loginWithPhone(phoneNumber);
    res.json(message);
});

app.post("/login/phone/verify", async (req, res) => {
    const { phoneNumber, code, requestId } = req.body;
    const message = await auth.loginWithPhoneVerify(
        phoneNumber,
        code,
        requestId
    );
    res.json(message);
});

app.get("/logout", jwtHelper.verifyToken, async (req, res) => {
    const token = req.headers["authorization"].split(" ")[1];
    const message = await auth.logout(token);
    res.json(message);
});

app.post(
    "/user/update",
    jwtHelper.verifyToken,
    utils.uploadFile.single("profileImage"),
    async (req, res) => {
        const user = req.body;
        const value = schemas.userSchema.validate(user);
        if (value.error) return res.json({ error: value.error });
        if (req.file) user.picture = req.file.filename;
        const message = await auth.updateUser(req.user._id, user);
        res.json(message);
    }
);

app.post("/user/change-password", jwtHelper.verifyToken, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const message = await auth.changePassword({
        oldPassword,
        newPassword,
        userCache: req.user,
    });
    res.json(message);
});

app.get("/user", jwtHelper.verifyToken, async (req, res) => {
    const user = await auth.getUser(req.user._id);
    res.json({ user });
});

app.get("/user/verify/:token", async (req, res) => {
    const token = req.params.token;
    const message = await auth.verifyUser({ token });
    res.send(message);
});

app.post("/user/forget-password", async (req, res) => {
    const { email } = req.body;
    const message = await auth.forgotPassword(email);
    res.send(message);
});

app.post("/user/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    const message = await auth.verifyOTP(email, otp);
    res.json(message);
});

app.post("/user/reset-password", async (req, res) => {
    const { email, otp, password } = req.body;
    const { error } = await auth.verifyOTP(email, otp);
    if (error) {
        res.json({ message: "Session Expired" });
    }
    const message = await auth.updatePassword(email, password);
    res.json(message);
});

app.post("/user/phone/verify", async (req, res) => {
    const { phoneNumber, code, requestId } = req.body;
    res.json(await auth.verifyPhoneNumber({ phoneNumber, code, requestId }));
});

app.post("/register/facebook", async (req, res) => {
    try {
        const { token, email, phoneNumber } = req.body;
console.log("token",token)
        // Verify Facebook token and get user info
        const fbResponse = await axios.get(`https://graph.facebook.com/me?fields=id,name,email&access_token=${token}`);
        const payload = fbResponse.data;

        if (!payload.email || payload.email !== email) {
            return res.status(400).json({ error: true, message: "Invalid email" });
        }

        // Register user
        const result = await auth.registerWithGoogle({
            email,
            phoneNumber,
            name: payload.name,
        });

        // Check if user exists in DB
        const user = await security_user.findOne({ email });

        if (user) {

console.log("now",user)
            const jwt = jwtHelper.createToken(user);
            return res.json({ ...result, token: jwt });
        }

console.log("not found");

        return res.status(400).json({ error: true, message: "Registration failed" });
    } catch (error) {
        console.error("Facebook Auth Error:", error);
        res.status(500).json({ error: true, message: "Authentication failed" });
    }
});

export default app;
