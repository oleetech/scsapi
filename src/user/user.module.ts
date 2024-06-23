import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { accessTokenGuard, refreshTokenGuard } from 'src/resourses/guard';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports:[
    PassportModule.register({}),
    JwtModule.register({})
  ],
  controllers: [UserController],
  providers: [UserService, accessTokenGuard, refreshTokenGuard],
})
export class UserModule {}
