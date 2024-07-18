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
            const limit = 10;
            const start = 0;
            const sort = {};
            if (args.filter) {
                const {
                    _id,
                    categories,
                    minPrice,
                    maxPrice,
                    parent_id,
                    name,
                    limit: lim,
                    start: strt,
                    sort: sortOption,
                    code,
                    keywords,
                } = args.filter;

                if (_id) {
                    filter._id = new mongoose.Types.ObjectId(_id);
                }

                if (name) {
                    filter.name = { $regex: name, $options: "i" };
                }

                if (code) {
                    filter.code = code;
                }

                if (categories && categories.length > 0) {
                    filter.categories = {
                        $in: categories.map(
                            (id) => new mongoose.Types.ObjectId(id)
                        ),
                    };
                }
                if (keywords && keywords.length > 0) {
                    filter.categories = {
                        $in: keywords,
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

                if (sortOption) {
                    sort[sortOption.field] =
                        sortOption.order === "asc" ? 1 : -1;
                }

                if (lim !== undefined) {
                    limit = lim;
                }

                if (strt !== undefined) {
                    start = strt;
                }
            }
            return await schemas.product
                .find(filter)
                .limit(limit)
                .skip(start)
                .sort(sort)
                .populate("categories")
                .populate("product_images")
                .populate({
                    path: "reviews",
                    populate: [
                        {
                            path: "user_id",
                        },
                    ],
                })
                .exec();
        },
        cart: async (parent, args, contextValue) => {
            const data = await schemas.cart
                .findOne({
                    user_id: contextValue.user._id,
                })
                .populate({
                    path: "products",
                    populate: [
                        { path: "categories" },
                        { path: "product_images" },
                    ],
                })
                .exec();
            return data;
        },
        wishlist: async (parent, args, contextValue) => {
            return await schemas.wishlist.findOne({
                user_id: contextValue.user._id,
            });
        },
        category: async () => {
            return await schemas.category.find().exec();
        },
        banner: async () => {
            return await schemas.banner.find().exec();
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
        addProductReview: async (parent, args, contextValue) => {
            const review = await schemas.product_review.findOne({
                user_id: contextValue.user._id,
                product_id: args.review.product_id,
            });
            if (!review) {
                const newReview = new schemas.product_review({
                    user_id: contextValue.user._id,
                    product_id: args.review.product_id,
                    review: args.review.review,
                    score: args.review.score,
                });
                await newReview.save();
                return newReview;
            } else {
                return await schemas.product_review.findOneAndUpdate(
                    {
                        user_id: contextValue.user._id,
                        product_id: args.review.product_id,
                    },
                    {
                        review: args.review.review,
                        score: args.review.score,
                    },
                    { new: true, useFindAndModify: false }
                );
            }
        },
    },
};
