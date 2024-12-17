class OTPLess {
    clientKey = process.env.OTPLESS_CLIENT_ID;
    clientSecret = process.env.OTPLESS_CLIENT_SECRET;
    baseURL = "https://auth.otpless.app/auth/v1";
    requestStore = new Map();

    constructor() {
        if (!this.clientKey || !this.clientSecret) {
            throw new Error(
                "Missing required environment variables: OTPLESS_CLIENT_ID and/or OTPLESS_CLIENT_SECRET"
            );
        }
    }

    async sendOTP({
        phoneNumber,
        expiry = 120,
        otpLength = 6,
        channels = ["SMS"],
        metadata = {},
    }) {
        try {
            if (!phoneNumber) {
                throw new Error("Phone number is required");
            }

            if (!this.isValidPhoneNumber(phoneNumber)) {
                throw new Error("Invalid phone number format");
            }

            const response = await fetch(`${this.baseURL}/initiate/otp`, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({
                    phoneNumber,
                    expiry,
                    otpLength,
                    channels,
                    metadata,
                }),
            });

            const result = await this.handleResponse(response);

            return result;
        } catch (error) {
            console.error("OTP sending failed:", error);
            throw error;
        }
    }

    async verifyOTP({ requestId, otp }) {
        try {
            if (!requestId || !otp) {
                throw new Error("Request ID and OTP are required");
            }

            const response = await fetch(`${this.baseURL}/verify/otp`, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({
                    requestId,
                    otp,
                }),
            });

            const result = await this.handleResponse(response);

            return result;
        } catch (error) {
            console.error("OTP verification failed:", error);
            throw error;
        }
    }

    getHeaders() {
        return {
            "Content-Type": "application/json",
            clientId: this.clientKey,
            clientSecret: this.clientSecret,
        };
    }

    async handleResponse(response) {
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.message || `HTTP error! status: ${response.status}`
            );
        }
        return await response.json();
    }

    isValidPhoneNumber(phoneNumber) {
        const phoneRegex = /^\+[1-9]\d{1,14}(?:-\d+)?$/;
        return phoneRegex.test(phoneNumber);
    }

    getRequestId(phoneNumber) {
        return this.requestStore.get(phoneNumber);
    }
}

export default new OTPLess();
