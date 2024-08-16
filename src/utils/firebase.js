import { initializeApp, credential } from "firebase-admin";
import { getMessaging } from "firebase-admin/messaging";
import schemas from "../database/schemas/index.js";
const serviceAccount = require("../../overray-firebase-service.json");

class Firebase {
    constructor() {
        this.admin = initializeApp({
            credential: credential.cert(serviceAccount),
        });
        this.message = getMessaging();
    }
    async sendNotificationToUser({ userId, title, body, data = {} }) {
        const device_token = await schemas.device_token.findOne({
            user_id: userId,
        });
        if (device_token) {
            await this.sendPushNotification(
                deviceToken.token,
                title,
                body,
                data
            );
        }
    }
    async sendPushNotification(deviceToken, title, body, data = {}) {
        const message = {
            notification: {
                title: title,
                body: body,
            },
            data: data,
            token: deviceToken,
        };

        try {
            const response = await message().send(message);
            console.log("Successfully sent message:", response);
            return response;
        } catch (error) {
            console.error("Error sending message:", error);
            throw error;
        }
    }
}

export default new Firebase();
