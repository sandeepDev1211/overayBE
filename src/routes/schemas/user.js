import Joi from "joi";

const userSchema = Joi.object({
    name: Joi.string().required(),
    dob: Joi.date().required(),
    address: Joi.string().required(),
    gender: Joi.string().required(),
});

export default userSchema;
