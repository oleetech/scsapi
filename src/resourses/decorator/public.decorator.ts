import { SetMetadata } from "@nestjs/common";

// Setting a metadata 'isPublic' to bypass 
//the global Authentication Guard of access tokens

// check access token strategy file for further clarification

export const Public = () => SetMetadata('isPublic', true);