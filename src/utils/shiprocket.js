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
            const company_id = response.data.shiprocket_recommended_courier_id;
            const delivery_data =
                response.data.available_courier_companies.find(
                    (x) => (x.courier_company_id = company_id)
                );
            return delivery_data;
        } catch (error) {
            logger.error(error);
        }
    }
    async createOrder(orderDetails, courier_company_id) {
        try {
            const order = await fetch(`${this.apiUrl}/orders/create/adhoc`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.token}`,
                },
                body: JSON.stringify(orderDetails),
            }).then((res) => res.json());
            const shipment_details = {
                shipment_id: order.shipment_id,
                courier_id: courier_company_id,
            };
            const shipment = await fetch(`${this.apiUrl}/courier/assign/awb`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.token}`,
                },
                body: JSON.stringify(shipment_details),
            }).then((res) => res.json());
            return shipment;
        } catch (error) {
            logger.error(error);
        }
    }
}

export default new Shiprocket();
