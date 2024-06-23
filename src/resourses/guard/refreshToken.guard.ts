import { AuthGuard } from "@nestjs/passport";

// As we have included 'jwt-refresh' in our refresh token strategy, it must be included here as well
// that is how the guard is getting access to the refresh token via strategy
export class refreshTokenGuard extends AuthGuard('jwt-refresh'){
    constructor(){
        super() // We are calling the super constructor; AuthGuard's constructor. 
                // It is a must
    }
}