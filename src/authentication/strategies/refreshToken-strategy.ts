import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Request } from "express";
import { Injectable } from "@nestjs/common";

@Injectable()
export class refreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh'){
    constructor(){
      super({
        // The data must be taken from Bearer
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        // REQUEST_TOKEN must be integrate in the .env file
        // REQUEST_TOKEN also must be unique from REQUEST_TOKEN
        secretOrKey: process.env.REQUEST_TOKEN,
        // We want to get back the refreshed token. Why?
        // Because unlike ACCES_TOKEN, REFRESH_TOKEN will be hashed
        // And compared w/ the existing token afterwards
        passReqtoCallback: true
      })  
    }

    async validate(req: Request, payload: any){
      console.log(payload);
    
      console.log(req);
      
      // Since we want to get the refresh token, we process it by
      // retrieving the value of the Authorization header from the HTTP request object (req). 
      //In a typical JWT authentication setup, the JWT token is often sent in the Authorization 
      //header prefixed with the word "Bearer", such as "Bearer <token>".

      // `.replace('Bearer', '')`: This method replaces the substring "Bearer" with an empty string. 
      // In JWT authentication, it's common practice to prefix the token with the word "Bearer" to indicate 
      // the type of token being sent. This code removes that prefix, leaving only the actual JWT token.

      // and removing any leading or trailing whitespace from the resulting string. 
      //It ensures that there are no accidental spaces before or after the token.

      // const refreshToken = req.get('authorization').replace('Bearer', '').trim();

      // REFRESH TOKEN COULDN'T BE RETRIEVED YET!
      // jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken() IS DECODING THE TOKEN
      
      return {
          ...req,
      }
    }
}