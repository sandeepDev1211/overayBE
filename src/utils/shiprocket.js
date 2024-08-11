import logger from "./logger.js";

class Shiprocket {
    constructor() {
        this.apiUrl = "https://apiv2.shiprocket.in/v1/external";
        this.email = process.env.SHIPROCKET_EMAIL;
        this.password = process.env.SHIPROCKET_PASSWORD;
        this.token = null;
    }

    async initialize() {
        try {
            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: this.email,
                    password: this.password,
                }),
            }).then((res) => res.json());
            this.token = response.token;
        } catch (error) {
            logger.error(error);
        }
    }

    async calculateShippingRate(deliveryPinCode, totalWeight) {
        try {
            const response = await fetch(
                `${this.apiUrl}/courier/serviceability?pickup_postcode=110045&delivery_postcode=${deliveryPinCode}&weight=${totalWeight}&cod=0`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.token}`,
                    },
                }
            ).then((res) => res.json());
            return response;
        } catch (error) {
            logger.error(error);
        }
    }
    async createOrder(orderDetails) {
        try {
            const response = fetch(`${this.apiUrl}/orders/create/adhoc`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.token}`,
                },
                body: JSON.stringify(orderDetails),
            }).then((res) => res.json());
            return response;
        } catch (error) {
            logger.error(error);
        }
    }
}

export default new Shiprocket();
