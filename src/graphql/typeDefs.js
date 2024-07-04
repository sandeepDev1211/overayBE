export const typeDefs = `#graphql
    type Address {
        _id: ID!,
        address_line_1: String!,
        address_line_2: String!,
        landmark: String,
        pincode: Int!
    }
    type Product {
        _id: ID!,
        code: String!,
        price: Int!,
        discount: Int!,
        parent_id: String,
        categories: [Category!]!,
        default_image: String
    }
    type Category {
        _id: ID!,
        name: String,
        description: String,
        parent_category: String
    }
    type Cart {
        _id: ID!,
        products: [Product]
    }
    type Wishlist {
        _id: ID!,
        products: [Product]
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
        cart: [Cart]
        wishlist: [Wishlist]
        category: [Category]
    }
    type Mutation {
        addAddress(address: AddAddressInput!): Address
        addProductToCart(product_id: String!): Cart
        removeProductFromCart(product_id: String!): Cart
        addProductToWishlist(product_id: String!): Wishlist
        removeProductFromWishlist(product_id: String!): Wishlist
    }
    input AddAddressInput {
        address_line_1: String!,
        address_line_2: String!,
        landmark: String,
        pincode: Int!
    }
    input SortInput {
        field: String!,
        order: String! 
    }
    input ProductFilter {
        _id: ID,
        name: String,
        categories: [ID!],
        minPrice: Float,
        maxPrice: Float,
        sort: SortInput,
        start: Int,
        limit: Int
    }
`;
