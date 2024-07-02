import category from "../database/schemas/category.js";
import schemas from "../database/schemas/index.js";
import mongoose from "mongoose";

export const resolvers = {
    Query: {
        addresses: async (parent, args, contextValue) => {
            return await schemas.address.find({
                user_Id: contextValue.user._id,
            });
        },
        products: async (parent, args) => {
            const filter = {};

            if (args.filter) {
                const { _id, categories, minPrice, maxPrice } = args.filter;

                if (_id) {
                    filter._id = new mongoose.Types.ObjectId(_id);
                }

                if (categories && categories.length > 0) {
                    filter.categories = {
                        $in: categories.map(
                            (id) => new mongoose.Types.ObjectId(id)
                        ),
                    };
                }

                if (minPrice !== undefined || maxPrice !== undefined) {
                    filter.price = {};

                    if (minPrice !== undefined) {
                        filter.price.$gte = minPrice;
                    }

                    if (maxPrice !== undefined) {
                        filter.price.$lte = maxPrice;
                    }
                }
            }

            return await schemas.product.find(filter).populate("categories");
        },
        cart: async (parent, args, contextValue) => {
            return await schemas.cart.findOne({
                user_id: contextValue.user._id,
            });
        },
        wishlist: async (parent, args, contextValue) => {
            return await schemas.wishlist.findOne({
                user_id: contextValue.user._id,
            });
        },
        category: async () => {
            return await schemas.category.find().exec();
        },
    },
    Mutation: {
        addAddress: (parent, args, contextValue) => {
            return schemas.address.create({
                address_line_1: args.address.address_line_1,
                address_line_2: args.address.address_line_2,
                landmark: args.address.landmark,
                pincode: args.address.pincode,
                user_id: contextValue.user._id,
            });
        },
        addProductToCart: async (parent, args, contextValue) => {
            return schemas.cart
                .findOne({ user_id: contextValue.user._id })
                .then((cart) => {
                    if (cart) {
                        // Cart found, update it
                        return schemas.cart.findOneAndUpdate(
                            { user_id: contextValue.user._id },
                            { $push: { products: args.product_id } },
                            { new: true, useFindAndModify: false }
                        );
                    } else {
                        // Cart not found, create a new one
                        const newCart = new schemas.cart({
                            user_id: contextValue.user._id,
                            products: [args.product_id],
                        });
                        return newCart.save();
                    }
                });
        },
        removeProductFromCart: async (parent, args, contextValue) => {
            return schemas.cart.findOneAndUpdate(
                { user_id: contextValue.user._id },
                { $pull: { products: args.product_id } },
                { new: true, useFindAndModify: false }
            );
        },
        addProductToWishlist: async (parent, args, contextValue) => {
            return schemas.wishlist
                .findOne({ user_id: contextValue.user._id })
                .then((cart) => {
                    if (cart) {
                        // Cart found, update it
                        return schemas.wishlist.findOneAndUpdate(
                            { user_id: contextValue.user._id },
                            { $push: { products: args.product_id } },
                            { new: true, useFindAndModify: false }
                        );
                    } else {
                        // Cart not found, create a new one
                        const newCart = new schemas.wishlist({
                            user_id: contextValue.user._id,
                            products: [args.product_id],
                        });
                        return newCart.save();
                    }
                });
        },
        removeProductFromWishlist: async (parent, args, contextValue) => {
            return schemas.wishlist.findOneAndUpdate(
                { user_id: contextValue.user._id },
                { $pull: { products: args.product_id } },
                { new: true, useFindAndModify: false }
            );
        },
    },
};
