import logger from "./logger.js";
import fetch from "node-fetch";


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
    async createOrder(orderDetails, courier_company_id = null) {
        try {
            const order = await fetch(`${this.apiUrl}/orders/create/adhoc`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.token}`,
                },
                body: JSON.stringify(orderDetails),
            }).then((res) => res.json());
    
            // Log the full response to check for any error messages from Shiprocket
            console.log("Shiprocket Order Response: ", order);
    
            if (!order || !order.shipment_id) {
                throw new Error("Failed to create Shiprocket order");
            }
    
            const shipment_details = {
                shipment_id: order.shipment_id,
            };
    
            if (courier_company_id) {
                shipment_details.courier_id = courier_company_id;
            }
    
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
            // Log detailed error for debugging
            console.log("error===>>", error);
            logger.error("Shiprocket Order Creation Failed:", error);
            throw error; // Re-throw the error after logging
        }
    }
    
    
    async getExpectedDeliveryDate(pickupPinCode, deliveryPinCode, weight) {
        try {
            if (!this.token) {
                throw new Error("Shiprocket API token is not initialized.");
            }

            const response = await fetch(
                `${this.apiUrl}/courier/serviceability?pickup_postcode=${pickupPinCode}&delivery_postcode=${deliveryPinCode}&weight=${weight}&cod=0`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.token}`,
                    },
                }
            ).then((res) => res.json());

            if (response.error) {
                throw new Error(response.error.message);
            }

            const company_id = response.data.shiprocket_recommended_courier_id;
            const delivery_data = response.data.available_courier_companies.find(
                (x) => x.courier_company_id === company_id
            );

            if (delivery_data) {
                const expected_delivery_date = delivery_data.estimated_delivery_days;
                return expected_delivery_date;
            } else {
                throw new Error("No available delivery options for the given pincode.");
            }
        } catch (error) {
            console.log("error",error)
            logger.error("Error getting expected delivery date:", error.message);
            return null;
        }
    }
}

export default new Shiprocket();
