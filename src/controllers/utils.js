import schemas from "../database/schemas/index.js";

export default {
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
    createResetPasswordEmail: async function ({ name, email }) {},
};
