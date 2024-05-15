export const typeDefs = `#graphql
    type Address {
        _id: ID!,
        address_line_1: String!,
        address_line_2: String!,
        landmark: String,
        pincode: Int!
    }

    type Query {
        addresses: [Address]
    }
    type Mutation {
        addAddress(address: AddAddressInput!): Address
    }
    input AddAddressInput {
        address_line_1: String!,
        address_line_2: String!,
        landmark: String,
        pincode: Int!
    }
`;
