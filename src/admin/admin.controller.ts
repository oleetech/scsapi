import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpCode, UseGuards, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Prisma } from '@prisma/client';
import { Token } from 'src/authentication/types';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { accessTokenGuard, refreshTokenGuard } from '../resourses/guard';
import { getCurrentUser, Public } from 'src/resourses/decorator';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAdminDto: Prisma.AdminCreateInput): Promise<{tokens: Token, adminID: Number, email: string, username: string}>{
    // The function must return a token payload that has access_token and refresh_token
    // also returns the adminID
    return await this.adminService.create(createAdminDto);
  }

  @Public()
  @Post('/signin')
  @HttpCode(HttpStatus.OK)
  async signin(@Body() signinData: { email: string; password: string }): Promise<{tokens: Token, adminID: Number}> {
    
    // Call the signinLocal method of AdminService to handle the signin logic
    const payload = await this.adminService.signinLocal(signinData);
    return payload;
  }

  @UseGuards(accessTokenGuard) 
  // Specifying that this AuthGuard is jwt is !!!IMPORTANT!!!
  // our accessTokenStrategy had extended PassportStrategy class as 'jwt'
  // Hence, we must specify it here as well
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    // @Req() req: Request
    @getCurrentUser('sub') userID:number
  ){
    // const user = req.user;

    return this.adminService.logout(userID);
  }

  @Public()
  @UseGuards(
    // AuthGuard('jwt-refresh')
    refreshTokenGuard
  )
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request){
    // refreshing the token to validate and secure the system
    const user = req.user;

    return this.adminService.refreshTokens(user['sub'],
    // user['refreshToken']
  );
  }

  @Get()
  async findAll() {
    return await this.adminService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: Number) {
    const result = await this.adminService.findOne(+id);

    if (result === HttpStatus.NOT_FOUND){
      return {message: `No Admin account found`, status: HttpStatus.NOT_FOUND}
    };
    
    return result
  }

  @Patch('updateAdmin/:id')
  update(@Param('id') id: string, @Body() updateAdminDto: Prisma.UserUpdateInput) {
    return this.adminService.update(+id, updateAdminDto);
  }

  @Delete('deleteAdmin/:id')
  remove(@Param('id') id: string) {
    return this.adminService.remove(+id);
  }
}
