import errorCodes from "../database/exceptionMapping.js";
import schemas from "../database/schemas/index.js";
import jwtHelper from "../middleware/jwtHelper.js";
import bcrypt from "bcryptjs";
import utils from "../utils/index.js";

const registerUser = async (userData) => {
    userData.password = await bcrypt.hash(userData.password, 10);
    const user = new schemas.security_user(userData);
    try {
        await user.save();
        const userData = new schemas.user({
            name: user.name,
            security_userId: user.id,
        });
        userData.save();
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

const loginUser = async (loginData) => {
    const user = await schemas.security_user.findOne({
        email: loginData.email,
        isActive: true,
    });
    if (!user) return { message: "User not found", error: true };
    const isPasswordValid = await bcrypt.compare(
        loginData.password,
        user.password
    );
    if (!isPasswordValid) {
        return { message: "Invalid email or password", error: true };
    }
    return { message: "loggedIn", token: jwtHelper.createToken(user) };
};

const getUser = async (userId) => {
    const user = await schemas.user.findOne({ security_userId: userId });
    return user;
};

const updateUser = async (userId, userData) => {
    let user = await schemas.user.findOne({ security_userId: userId });
    if (!user) return { message: "User Not Found", error: true };
    user = utils.updateObject(user, userData);
    user.save();
    return { message: "updated" };
};

export default { registerUser, loginUser, getUser, updateUser };
