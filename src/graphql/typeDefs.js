export const typeDefs = `#graphql
    type Address {
        _id: ID!,
        name: String,
        email: String,
        phone_number: String,
        address_line_1: String,
        address_line_2: String,
        city: String,
        state: String,
        country: String,
        pincode: String
    }
    type ProductImage {
        _id: ID!,
        product_id: String,
        image_name: String
    }
    type User {
        name: String!,
        picture: String
    }
    type AddedReview {
        user_id: String,
        review: String,
        score: Float,
        product_id: String
    }
    type Review {
        user_id: User,
        review: String,
        score: Float
    }
    type Product {
        _id: ID!,
        name: String!,
        code: String!,
        price: Int!,
        description: String!,
        long_description: String,
        discount: Int!,
        size: String!,
        color: String!,
        categories: [Category!]!,
        default_image: String,
        product_images: [ProductImage],
        reviews: [Review],
        keywords: [String]
    }
    type Category {
        _id: ID!,
        name: String,
        description: String,
        parent_category: String,
        image: String
    }
    type AddedCartProduct {
        productId: String
        quantity: Int
    }
    type CartProduct {
        productId: Product,
        quantity: Int
    }
    type Cart {
        _id: ID!,
        products: [CartProduct]
    }
    type Lookup {
        name: String!,
        lookup_type: String!,
        description: String!,
    }
    type AddedCart {
        _id: ID!,
        products: [AddedCartProduct]
    }
    type Wishlist {
        _id: ID!,
        products: [Product]
    }
    type AddedWishlist {
        _id: ID!,
        products: [String]
    }
    type Banner {
        _id: ID!,
        name: String,
        banner_image: String,
        banner_type: String
    }
    type Query {
        addresses: [Address]
        products(filter: ProductFilter): [Product]
        cart: Cart
        wishlist: Wishlist
        category: [Category]
        banner: [Banner]
        lookup: [Lookup]
    }
    type Mutation {
        addAddress(address: AddAddressInput!): Address
        removeAddress(address_id: String!): Boolean
        addProductToCart(products: CartInput): AddedCart
        removeProductFromCart(product_id: String!): AddedCart
        addProductToWishlist(product_id: String!): AddedWishlist
        removeProductFromWishlist(product_id: String!): AddedWishlist
        addProductReview(review: ReviewInput!): AddedReview
    }
    input AddAddressInput {
        name: String,
        email: String,
        phone_number: String,
        address_line_1: String,
        address_line_2: String,
        city: String,
        state: String,
        country: String,
        pincode: String
    }
    input SortInput {
        field: String!,
        order: String! 
    }
    input ProductFilter {
        _id: ID,
        name: String,
        categories: [ID!],
        size: String,
        color: String,
        minPrice: Float,
        maxPrice: Float,
        sort: SortInput,
        start: Int,
        limit: Int,
        code: String,
        keywords: [String]
    }
    input ReviewInput {
        review: String,
        score: Float,
        product_id: String
    }
    input CartInput {
        product_id: ID!
        quantity: Int
    }
`;
