import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

type JwtPayload = {
  sub: string
  email: string
}

@Injectable()
export class accessTokenStrategy extends PassportStrategy(Strategy, 'jwt'){
    constructor(){
      super({
        // The data must be taken from Bearer
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        // ACCESS_TOKEN must be integrate in the .env file
        // ACCESS_TOKEN also must be unique from REQUEST_TOKEN
        secretOrKey: process.env.ACCESS_TOKEN_KEY
      })  
    }

    // the payload is JwtPaylaod because any is not secure. This is much more secure-friendly
    validate(payload: JwtPayload){

      // console.log('payload', payload);
      return payload;

      // req.user = payload basically as express.js
    }
}