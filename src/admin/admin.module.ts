import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { accessTokenStrategy, refreshTokenStrategy } from 'src/authentication/strategies';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports:[
    PassportModule.register({}),
    JwtModule.register({})],
  controllers: [AdminController],
  providers: [AdminService, accessTokenStrategy, refreshTokenStrategy],
})
export class AdminModule {}
