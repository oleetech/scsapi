
// This code defines a TypeScript type called Token. In TypeScript, you can define custom types to specify the shape of data that your application expects.

// In this case, the Token type is defined as an object with two properties:

// accessToken: This property is of type string, indicating it holds a string value representing an access token.
// refreshToken: This property is also of type string, representing a refresh token.
// By defining this type, you can ensure that any variable or parameter declared with the type Token must adhere to this structure, containing both an accessToken and a refreshToken, both of which are of type string

export type Token = {
    accessToken: string;
    refreshToken: string;
}
