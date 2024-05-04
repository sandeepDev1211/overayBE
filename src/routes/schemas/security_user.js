import Joi from "joi";

const securityUserSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().pattern(/^[a-zA-Z0-9]{3,30}$/),
    phoneNumber: Joi.number().required(),
});

export default securityUserSchema;
