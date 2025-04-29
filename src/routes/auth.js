import { Router } from "express";
import schemas from "./schemas/index.js";
import auth from "../controllers/auth.js";
import jwtHelper from "../middleware/jwtHelper.js";
import utils from "../utils/index.js";
import { OAuth2Client } from "google-auth-library";
import logger from "../utils/logger.js";
import security_user from "../database/schemas/security_user.js";
import address from "../database/schemas/address.js"
import axios from 'axios';

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
        const { token, email, phoneNumber = null , device_token = null, platform = "android"} = req.body;

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

        if (result.error) {
            return res.status(400).json({ error: true, message: result.message });
        }

        const user = await security_user.findOne({ email });
        if (user) {
            if (deviceToken) {
                await schemas.device_token.findOneAndUpdate(
                    { user_id: user._id }, 
                    {
                        token: deviceToken,
                        platform: platform || "android",
                    },
                    { upsert: true, new: true } 
                );
            }
            const jwt = jwtHelper.createToken(user);
            return res.json({ ...result, token: jwt });
        }

        return res.status(400).json({ error: true, message: "Registration failed - user not found after registration" });
    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(500).json({ error: true, message: error.message || "Authentication failed" });
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

// routes/auth.js or wherever your route lives
app.post("/register/facebook", async (req, res) => {
try {
        const { token, email, phoneNumber } = req.body;
        console.log("👉 Received:", req.body);

        const fbResponse = await axios.get(`https://graph.facebook.com/me?fields=id,name,email&access_token=${token}`);
        const payload = fbResponse.data;

        if (!payload.email || payload.email !== email) {
            return res.status(400).json({ error: true, message: "Invalid email" });
        }

        console.log("✅ Facebook Response:", payload);

        const result = await auth.registerWithGoogle({
            email,
            phoneNumber,
            name: payload.name,
        });

        return res.json(result);

    }  catch (error) {
        console.error("❌ Facebook Auth Error:", error);
        return res.status(500).json({ error: true, message: "Authentication failed" });
    }
});


app.get("/address-list", async (req, res) => {
    try {
        const addresses = await address.find({ user_id: req.query.userId });
        return res.json(addresses);
    } catch (error) {
        console.error("Error fetching addresses:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/add-address", async (req, res) => {
    try {
        const {
            name,
            email,
            phone_number,
            address_line_1,
            address_line_2,
            city,
            state,
            country,
            pincode,
            userId
        } = req.body;

        if (
            !name || !email || !phone_number || !address_line_1 ||
            !address_line_2 || !city || !state || !country || !pincode
        ) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const userAddress = new address({
            name,
            email,
            phone_number,
            address_line_1,
            address_line_2,
            city,
            state,
            country,
            pincode,
            user_id: userId
        });

        await userAddress.save();
        res.status(201).json({ message: "Address added successfully", userAddress });
    } catch (error) {
        console.error("Error adding address:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


export default app;
