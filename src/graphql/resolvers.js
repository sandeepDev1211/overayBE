import schemas from "../database/schemas/index.js";

export const resolvers = {
    Query: {
        async addresses(parent, args, contextValue) {
            return await schemas.address.find({
                security_userId: contextValue.user._id,
            });
        },
    },
    Mutation: {
        addAddress(parent, args, contextValue) {
            return schemas.address.create({
                address_line_1: args.address.address_line_1,
                address_line_2: args.address.address_line_2,
                landmark: args.address.landmark,
                pincode: args.address.pincode,
                security_userId: contextValue.user._id,
            });
            console.log(args.address.address_line_1);
        },
    },
};
