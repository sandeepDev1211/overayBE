import schemas from "../database/schemas/index.js";
import logger from "../utils/logger.js";
import optless from "../utils/otpless.js";
export default {
    expiresIn: 15,
    createVerificationEmail: async function ({
        verificationToken,
        name,
        email,
    }) {
        const verificationLink = `${process.env.BASE_URL}/v1/auth/user/verify/${verificationToken}`;
        const email_queue = new schemas.email_queue({
            email_template: "verification_email_template",
            tags: { verificationLink, name },
            subject: "Overray Email Verification",
        });

        await email_queue.save();
        const email_recipient = new schemas.email_recipient({
            name,
            email,
            email_queue_id: email_queue._id,
        });
        email_recipient.save();
    },
    createResetPasswordEmail: async function ({ name, email, otp }) {
        const reset_password = new schemas.reset_password({
            email,
            otp,
            expiresAt: new Date(Date.now() + this.expiresIn * 60000),
        });
        reset_password.save();
        const email_queue = new schemas.email_queue({
            email_template: "reset_password_template",
            tags: { name, otp, expirationTime: this.expiresIn },
            subject: "Account Password Recovery",
        });
        await email_queue.save();
        const email_recipient = new schemas.email_recipient({
            name,
            email,
            email_queue_id: email_queue._id,
        });
        email_recipient.save();
    },
    sendPhoneVerification: async (phoneNumber) => {
        return optless.sendOTP({ phoneNumber });
    },
    verifyPhoneVerification: async (requestId, code) => {
        const result = await optless.verifyOTP({ requestId, otp: code });
        return result.isOTPVerified;
    },
};
