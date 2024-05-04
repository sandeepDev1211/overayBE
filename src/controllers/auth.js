import errorCodes from "../database/exceptionMapping.js";
import schemas from "../database/schemas/index.js";

const registerUser = async (userData) => {
    const user = new schemas.security_user(userData);
    try {
        await user.save();
        return { error: false, message: "Created" };
    } catch (error) {
        const errorMessage = {
            error: true,
            message: `${Object.keys(error.keyValue)[0]} is ${
                errorCodes[error.code].message
            }`,
        };

        return errorMessage;
    }
};

export default { registerUser };
