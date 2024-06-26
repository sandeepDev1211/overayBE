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
        name: String
    }
    type Cart {
        _id: ID!,
        products: [Product]
    }
    type Query {
        addresses: [Address]
        products(filter: ProductFilter): [Product]
        cart: [Cart]
    }
    type Mutation {
        addAddress(address: AddAddressInput!): Address
        addProductToCart(product_id: String!): Cart
        removeProductFromCar(product_id: String!): Cart
    }
    input AddAddressInput {
        address_line_1: String!,
        address_line_2: String!,
        landmark: String,
        pincode: Int!
    }
    input ProductFilter {
        _id: ID
        categories: [ID!]
        minPrice: Float
        maxPrice: Float
  }
`;
