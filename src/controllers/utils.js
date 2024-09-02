import schemas from "../database/schemas/index.js";
import logger from "../utils/logger.js";
import Twilio from "twilio";
const client = Twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);
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
    sendPhoneVerification: (phoneNumber) => {
        client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICEID)
            .verifications.create({ to: phoneNumber, channel: "sms" })
            .catch((err) => logger.error(err));
    },
    verifyPhoneVerification: async (phoneNumber, code) => {
        const result = await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICEID)
            .verificationChecks.create({ to: phoneNumber, code: code })
            .catch((error) => logger.error(error));
        return result.status === "approved";
    },
};
