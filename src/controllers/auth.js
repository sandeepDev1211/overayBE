import schemas from "../database/schemas/index.js";
import jwtHelper from "../middleware/jwtHelper.js";
import bcrypt from "bcryptjs";
import utils from "./utils.js";
import globalUtil from "../utils/index.js";
import logger from "../utils/logger.js";

const registerUser = async (userData) => {
    userData.password = await bcrypt.hash(userData.password, 10);
    const user = new schemas.security_user(userData);
    try {
        user.verificationToken = jwtHelper.createVerificationToken(user.email);
        await user.save();
        const userData = new schemas.user({
            name: user.name,
            email: user.email,
            phone: user.phoneNumber,
            _id: user.id,
        });
        userData.save();
        utils.createVerificationEmail({
            verificationToken: user.verificationToken,
            name: user.name,
            email: user.email,
        });
        utils.sendPhoneVerification(userData.phone);
        return { error: false, message: "Verify your email and phone number" };
    } catch (error) {
        logger.error(error);
        const errorMessage = {
            error: true,
            message:
                "Something went wrong!! Please contact system administrator",
        };
        if (error.message.includes("duplicate")) {
            errorMessage.message = "User already exists";
        }
        return errorMessage;
    }
};

const loginUser = async (loginData) => {
    const user = await schemas.security_user.findOne({
        email: loginData.email,
    });
    if (!user) return { message: "User not found", error: true };
    if (!user.isActive) return { message: "User is not active", error: true };
    if (!user.password)
        return {
            message:
                "User is not registered using signup form please use other login menthod",
            error: true,
        };
    const isPasswordValid = await bcrypt.compare(
        loginData.password,
        user.password
    );
    if (!isPasswordValid) {
        return { message: "Invalid email or password", error: true };
    }
    return { message: "loggedIn", token: jwtHelper.createToken(user) };
};

const loginWithPhone = async (phoneNumber) => {
    const user = await schemas.security_user.findOne({ phoneNumber });
    if (!user) return { message: "User not found", error: true };
    const requestData = await utils.sendPhoneVerification(phoneNumber);
    return { message: "Verification code sent", requestData, error: false };
};

const loginWithPhoneVerify = async (phoneNumber, code, requestId) => {
    const isValid = await utils.verifyPhoneVerification(requestId, code);
    if (!isValid) return { message: "Invalid code", error: true };
    const user = await schemas.security_user.findOne({ phoneNumber });
    if (!user) return { message: "User not found", error: true };
    return { message: "loggedIn", token: jwtHelper.createToken(user) };
};

const getUser = async (userId) => {
    const user = await schemas.user.findById(userId);
    return user;
};

const updateUser = async (userId, userData) => {
    let user = await schemas.user.findById(userId);
    if (!user) return { message: "User Not Found", error: true };
    user = globalUtil.updateObject(user, userData);
    user.save();
    return { message: "updated" };
};

const changePassword = async ({ oldPassword, newPassword, userCache }) => {
    const user = await schemas.security_user.findById(userCache._id);
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
        return { message: "Current Password is wrong", error: true };
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.save();
    return { message: "updated" };
};

const verifyUser = async ({ token }) => {
    const decodedToken = jwtHelper.verifyVerificationToken(token);
    if (!decodedToken) {
        return "Invalid URL";
    }
    const user = await schemas.security_user.findOne({
        email: decodedToken.email,
        verificationToken: token,
    });
    if (!user) {
        return "Invalid URL";
    }
    user.isEmailVerified = true;
    user.verificationToken = null;
    user.save();
    return "Verified";
};

const verifyPhoneNumber = async ({ phoneNumber, code, requestId }) => {
    const success = await utils.verifyPhoneVerification(requestId, code);
    if (success) {
        const user = await schemas.security_user.findOne({ phoneNumber });
        if (!user) {
            return { success: false, message: "Invalid Verification" };
        }
        user.isPhoneVerified = true;
        user.save();
    }
    return { success };
};

const forgotPassword = async (email) => {
    const user = await schemas.security_user.findOne({ email });
    if (!user) {
        return { message: "User not found", error: true };
    }
    const otp = Math.floor(100000 + Math.random() * 900000)
        .toString()
        .padStart(6, "0");
    utils.createResetPasswordEmail({ name: user.name, email: user.email, otp });
    return { message: "OTP Sent" };
};

const verifyOTP = async (email, otp) => {
    const reset_password = await schemas.reset_password.findOne({
        email,
        otp,
        expiresAt: { $gt: new Date() },
    });
    if (!reset_password) {
        return { message: "Invalid OTP", error: true };
    }
    return { message: "OTP verified successfully" };
};

const updatePassword = async (email, password) => {
    password = await bcrypt.hash(password, 10);
    const user = await schemas.security_user.findOneAndUpdate(
        { email },
        { $set: { password } }
    );
    schemas.reset_password.findOneAndDelete({ email });
    return { message: "Password Reset Successful" };
};

const logout = async (token) => {
    const blocked_token = new schemas.blocked_token({
        token,
    });
    await blocked_token.save();
    return { message: "Logout Succesfully" };
};

// services/auth.jsuserData.phoneNumber });
export const registerWithGoogle = async (userData) => {
    try {
        console.log("📍 [Controller] registerWithGoogle called with:", userData);

        // 👉 Check for existing email
        const existingEmailUser = await schemas.security_user.findOne({ email: userData.email });
        if (existingEmailUser) {
            console.log("✅ Existing user found with email:", userData.email);
            const token = jwtHelper.createToken(existingEmailUser);
            return {
                error: false,
                message: "loggedIn",
                user: existingEmailUser,
                token,
            };
        }

        // 👉 Prepare userPayload
        const userPayload = {
            isEmailVerified: true,
            ...userData,
        };

        console.log("nowww", userPayload.phoneNumber);

        // 👉 If phoneNumber is null or undefined, remove it from the payload
        if (userPayload.phoneNumber === null || userPayload.phoneNumber === undefined) {
            console.log("Deleting phoneNumber from payload");
            delete userPayload.phoneNumber;
        }

        // ✅ New user registration
        const user = new schemas.security_user(userPayload);
        const savedUser = await user.save();
        console.log("✅ security_user created:", savedUser.email);

        const userProfile = new schemas.user({
            name: savedUser.name,
            email: savedUser.email,
            phone: savedUser.phoneNumber, // Here, phone will be undefined or not included
            _id: savedUser._id,
        });

        const savedProfile = await userProfile.save();
        console.log("✅ user profile created:", savedProfile.email);

        // 📞 Optional: Send phone verification if phone exists
        if (savedProfile.phone) {
            try {
                console.log("📞 Sending phone verification to:", savedProfile.phone);
                await utils.sendPhoneVerification(savedProfile.phone);
            } catch (otpError) {
                console.warn("⚠️ OTP sending failed:", otpError.message);
            }
        }

        const token = jwtHelper.createToken(savedUser);
        return {
            error: false,
            message: "loggedIn",
            user: savedUser,
            token,
        };

    } catch (error) {
        console.error("❌ Error in registerWithGoogle:", error);
        return { error: true, message: error.message || "Registration failed" };
    }
};





       

const loginWithGoogle = async (email) => {
    const user = await schemas.security_user.findOne({ email });
    if (!user) return { message: "User not found", error: true };
    if (!user.isActive) return { message: "User is not active", error: true };
    return { message: "loggedIn", token: jwtHelper.createToken(user) };
};
export default {
    registerUser,
    loginUser,
    getUser,
    updateUser,
    changePassword,
    verifyUser,
    forgotPassword,
    verifyOTP,
    updatePassword,
    logout,
    verifyPhoneNumber,
    registerWithGoogle,
    loginWithGoogle,
    loginWithPhone,
    loginWithPhoneVerify,
};
