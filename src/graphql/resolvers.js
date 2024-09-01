import schemas from "../database/schemas/index.js";
import mongoose from "mongoose";
import { GraphQLError } from "graphql";

const checkAuthentication = (context) => {
    if (!context.user)
        throw new GraphQLError(
            "You are not authorized to perform this action.",
            {
                extensions: {
                    code: "UNAUTHENTICATED",
                    http: { status: 401 },
                },
            }
        );
};

export const resolvers = {
    Query: {
        addresses: async (parent, args, contextValue) => {
            checkAuthentication(contextValue);
            return await schemas.address.find({
                user_id: contextValue.user._id,
            });
        },
        products: async (parent, args) => {
            const filter = {};
            let limit = 10;
            let start = 0;
            let sort = {};
            let textSearchApplied = false;

            if (args.filter) {
                const {
                    _id,
                    categories,
                    size,
                    color,
                    minPrice,
                    maxPrice,
                    name,
                    limit: lim,
                    start: strt,
                    sort: sortOption,
                    code,
                    keywords,
                    query,
                } = args.filter;

                if (_id) {
                    filter._id = new mongoose.Types.ObjectId(_id);
                }

                if (name) {
                    filter.name = { $regex: name, $options: "i" };
                }

                if (size) {
                    filter.size = size;
                }

                if (color) {
                    filter.color = color;
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
                    filter.keywords = {
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

                if (query) {
                    filter.$text = { $search: query };
                    textSearchApplied = true;
                    if (!sortOption) {
                        sort = { score: { $meta: "textScore" } };
                    }
                } else if (sortOption) {
                    sort = {
                        [sortOption.field]: sortOption.order === "asc" ? 1 : -1,
                    };
                }

                if (lim !== undefined) {
                    limit = lim;
                }

                if (strt !== undefined) {
                    start = strt;
                }
            }

            const findQuery = schemas.product.find(filter);

            if (textSearchApplied) {
                findQuery.select({ score: { $meta: "textScore" } });
            }

            // Only apply sort if it's not empty
            if (Object.keys(sort).length > 0) {
                findQuery.sort(sort);
            }

            const results = await findQuery
                .limit(limit)
                .skip(start)
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

            return results;
        },
        cart: async (parent, args, contextValue) => {
            checkAuthentication(contextValue);
            const data = await schemas.cart
                .findOne({
                    user_id: contextValue.user._id,
                })
                .populate({
                    path: "products.productId",
                    populate: [
                        { path: "categories" },
                        { path: "product_images" },
                    ],
                })
                .exec();
            return data;
        },
        wishlist: async (parent, args, contextValue) => {
            checkAuthentication(contextValue);
            const data = await schemas.wishlist
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
        category: async () => {
            return await schemas.category.find().exec();
        },
        banner: async () => {
            return await schemas.banner.find().exec();
        },
        lookup: async () => {
            return await schemas.lookup.find().exec();
        },
        coupons: async (_, { filter }, { models }) => {
            try {
                let query = {};

                if (filter) {
                    if (filter.is_active !== undefined) {
                        query.is_active = filter.is_active;
                    }

                    if (filter.valid_now) {
                        const now = new Date();
                        query.valid_from = { $lte: now };
                        query.valid_until = { $gte: now };
                    }

                    if (filter.min_discount_value !== undefined) {
                        query.discount_value = {
                            $gte: filter.min_discount_value,
                        };
                    }

                    if (filter.max_discount_value !== undefined) {
                        query.discount_value = {
                            ...query.discount_value,
                            $lte: filter.max_discount_value,
                        };
                    }
                }

                return await models.Coupon.find(query);
            } catch (error) {
                console.error("Error fetching coupons:", error);
                throw new Error("Failed to fetch coupons");
            }
        },
        coupon: async (_, { id }, { models }) => {
            try {
                return await models.Coupon.findById(id);
            } catch (error) {
                console.error("Error fetching coupon:", error);
                throw new Error("Failed to fetch coupon");
            }
        },
    },
    Mutation: {
        addAddress: (parent, args, contextValue) => {
            checkAuthentication(contextValue);
            const address = args.address;
            address.user_id = contextValue.user._id;
            return schemas.address.create(address);
        },
        removeAddress: async (parent, args, contextValue) => {
            checkAuthentication(contextValue);
            const deleted = await schemas.address
                .findOneAndDelete({
                    _id: args.address_id,
                    user_id: contextValue.user._id,
                })
                .exec();
            return !!deleted;
        },
        addProductToCart: async (parent, args, contextValue) => {
            checkAuthentication(contextValue);
            const { product_id, quantity = 1 } = args.products;
            let cart = await schemas.cart.findOne({
                user_id: contextValue.user._id,
            });
            if (cart) {
                const plainProducts = cart.products.toObject();

                const existingProductIndex = plainProducts.findIndex(
                    (x) => x.productId.toString() === product_id.toString()
                );
                if (existingProductIndex !== -1) {
                    cart.products[existingProductIndex].quantity = quantity;
                } else {
                    cart.products.push({
                        productId: product_id,
                        quantity: quantity,
                    });
                }
                return cart.save();
            }
            cart = new schemas.cart({
                user_id: contextValue.user._id,
                products: [
                    {
                        productId: product_id,
                        quantity: !quantity ? 1 : quantity,
                    },
                ],
            });
            return cart.save();
        },
        removeProductFromCart: async (parent, args, contextValue) => {
            checkAuthentication(contextValue);
            return schemas.cart.findOneAndUpdate(
                { user_id: contextValue.user._id },
                { $pull: { products: { productId: args.product_id } } },
                { new: true, useFindAndModify: false }
            );
        },
        addProductToWishlist: async (parent, args, contextValue) => {
            checkAuthentication(contextValue);
            let wishlist = await schemas.wishlist.findOne({
                user_id: contextValue.user._id,
            });
            if (!wishlist) {
                wishlist = new schemas.wishlist({
                    user_id: contextValue.user._id,
                    products: [args.product_id],
                });
                wishlist = await wishlist.save();
                return wishlist;
            }
            wishlist.products = [...wishlist.products, args.product_id];
            wishlist = await wishlist.save();
            return wishlist;
        },
        removeProductFromWishlist: async (parent, args, contextValue) => {
            checkAuthentication(contextValue);
            return schemas.wishlist.findOneAndUpdate(
                { user_id: contextValue.user._id },
                { $pull: { products: args.product_id } },
                { new: true, useFindAndModify: false }
            );
        },
        addProductReview: async (parent, args, contextValue) => {
            checkAuthentication(contextValue);
            const { review, score, product_id } = args.review;

            let product_review = await schemas.product_review.findOne({
                user_id: contextValue.user._id,
                product_id: product_id,
            });
            if (!product_review) {
                const newReview = new schemas.product_review({
                    user_id: contextValue.user._id,
                    product_id: product_id,
                    review: review,
                    score: score,
                });
                product_review = await newReview.save();
                return product_review;
            }
            product_review.review = review;
            product_review.score = score;
            product_review = await product_review.save();
            return product_review;
        },
    },
};
