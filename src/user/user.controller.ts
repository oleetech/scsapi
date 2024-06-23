import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { UserService } from './user.service';
import { getCurrentUser, Public } from 'src/resourses/decorator';
import { Prisma } from '@prisma/client';
import { Request } from 'express';
import { Token } from 'src/authentication/types';
import { accessTokenGuard, refreshTokenGuard } from '../resourses/guard';
// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';

// @Public()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post()
  async create(
    @Body() createUserDto: Prisma.UserCreateInput,
  ): Promise<{
    tokens: Token;
    userID: Number;
    email: string;
    username: string;
  }> {
    return await this.userService.create(createUserDto);
  }

  @Public()
  @Post('/signin')
  @HttpCode(HttpStatus.OK)
  async signin(
    @Body() signinData: { email: string; password: string },
  ): Promise<{
    tokens: Token;
    userID: Number;
    email: string;
    username: string;
  }> {
    return await this.userService.signinLocal(signinData);
  }

  @UseGuards(accessTokenGuard)
  // Specifying that this AuthGuard is jwt is !!!IMPORTANT!!!
  // our accessTokenStrategy had extended PassportStrategy class as 'jwt'
  // Hence, we must specify it here as well
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    // @Req() req: Request
    @getCurrentUser('sub') userID: number,
  ) {
    // const user = req.user;
    console.log('logout:', userID);

    return this.userService.logout(userID);
  }

  @Public()
  @UseGuards(
    // AuthGuard('jwt-refresh')
    refreshTokenGuard,
  )
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request) {
    // refreshing the token to validate and secure the system
    const user = req.user;

    return this.userService.refreshTokens(user['sub']);
  }

  @Get()
  async findAll() {
    return await this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.userService.findOne(+id);

    if (result === HttpStatus.NOT_FOUND) {
      return { message: `No User account found`, status: HttpStatus.NOT_FOUND };
    }

    return result;
  }

  @Put('update-user/:id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDTO: Prisma.UserUpdateInput,
  ) {
    return this.userService.update(id, updateUserDTO);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   return this.userService.update(+id, updateUserDto);
  // }
}
