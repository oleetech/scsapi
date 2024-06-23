import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { Token } from 'src/authentication/types';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from 'src/dbs_config/database/database.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(
    private readonly databaseService: DatabaseService,
    private jwtService: JwtService,
  ) {}
  async create(createUserDto: Prisma.UserCreateInput): Promise<{
    tokens: Token;
    userID: Number;
    email: string;
    username: string;
    designation: string;
  }> {
    const result = await this.databaseService.user.findFirst({
      where: {
        email: createUserDto.email,
      },
    });

    if (result) {
      throw new ForbiddenException(`${createUserDto.email} registered`);
    }
    console.log(
      typeof createUserDto.email,
      typeof createUserDto.password,
      typeof createUserDto.name,
    );

    if (
      typeof createUserDto.email !== 'string' ||
      typeof createUserDto.password !== 'string' ||
      typeof createUserDto.name !== 'string'
    )
      throw new BadRequestException();

    const hashedPassword = await this.hashed(createUserDto.password);

    const newUser = await this.databaseService.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        name: createUserDto.name,
        designation: createUserDto.designation,
        softDel: false,
      },
    });

    const tokens = await this.getTokens(newUser.userid, newUser.email);

    await this.updateRTHash(newUser.userid, tokens.refreshToken);

    const data = {
      tokens,
      userid: newUser.userid,
    };

    return {
      tokens,
      userID: newUser.userid,
      email: newUser.email,
      username: newUser.name,
      designation: newUser.designation,
    };
  }

  async signinLocal(userDTO: { email: string; password: string }): Promise<{
    tokens: Token;
    userID: Number;
    email: string;
    username: string;
  }> {
    const isUserExist = await this.databaseService.user.findFirst({
      where: {
        email: userDTO.email,
      },
    });

    if (!isUserExist)
      throw new ForbiddenException(
        `Access Denied: ${userDTO.email} is not registered.`,
      );

    const isPasswordMatch = bcrypt.compare(
      userDTO.password,
      isUserExist.password,
    );
    if (!isPasswordMatch) {
      throw new ForbiddenException(
        `Access Denied: ${userDTO.email}'s password do not match.`,
      );
    }

    const tokens = await this.getTokens(isUserExist.userid, isUserExist.email);

    await this.updateRTHash(isUserExist.userid, tokens.refreshToken);

    return {
      tokens,
      userID: isUserExist.userid,
      email: isUserExist.email,
      username: isUserExist.name,
    };
  }

  async logout(userID: number) {
    await this.databaseService.user.update({
      where: {
        userid: userID,
        hashedRT: {
          not: null, // Will only get the user w/ userID that has a hashRT in DBS
        },
      },
      data: {
        hashedRT: null,
      },
    });

    console.log(
      await this.databaseService.user.findFirst({
        where: {
          userid: userID,
        },
      }),
    );
  }

  async refreshTokens(
    userid: number,
    // refreshToken: string
  ) {
    const user = await this.databaseService.user.findUnique({
      where: {
        userid,
      },
    });

    if (!user || !user.hashedRT) throw new UnauthorizedException();

    // const isRTMatch = bcrypt.compare(refreshToken, user.hashedRT);

    // if (!isRTMatch)
    //   throw new ForbiddenException(`Access Denied: Refresh Token did not match`);

    const tokens = await this.getTokens(user.userid, user.email);
    await this.updateRTHash(user.userid, tokens.refreshToken);

    return tokens;
  }

  async findAll() {
    return await this.databaseService.user.findMany({
      where: {
        softDel: false,
      },
      select: {
        userid: true,
        name: true,
        email: true,
        designation: true,
      },
    });
  }

  async findOne(id: number) {
    const result = await this.databaseService.user.findUnique({
      where: {
        userid: id,
        softDel: false,
      },
      select: {
        userid: true,
        name: true,
        email: true,
        designation: true,
      },
    });

    if (!result) {
      return HttpStatus.NOT_FOUND;
    }

    return result;
  }

  async update(id: number, updateUserDTO: Prisma.UserUpdateInput) {
    // Check if all required fields are strings
    if (
      typeof updateUserDTO.email !== 'string' ||
      typeof updateUserDTO.password !== 'string' ||
      typeof updateUserDTO.name !== 'string' ||
      typeof updateUserDTO.designation !== 'string'
    ) {
      throw new BadRequestException();
    }

    // Check if the user with the provided ID exists
    const existingUser = await this.databaseService.user.findFirst({
      where: { userid: id },
    });

    if (!existingUser) {
      throw new BadRequestException(`User with ID ${id} does not exist`);
    }

    // Check if the email already exists in the database and belongs to a different user
    const userWithSameEmail = await this.databaseService.user.findFirst({
      where: { email: updateUserDTO.email },
    });

    if (userWithSameEmail && userWithSameEmail.userid !== id) {
      throw new ForbiddenException(`${updateUserDTO.email} already exists`);
    }

    // Hash the password
    const hashedPassword = await this.hashed(updateUserDTO.password);

    // Update the user details
    const updatedUser = await this.databaseService.user.update({
      where: { userid: id },
      data: {
        email: updateUserDTO.email,
        name: updateUserDTO.name,
        password: hashedPassword,
        designation: updateUserDTO.designation,
      },
    });

    // Generate tokens
    const tokens = await this.getTokens(updatedUser.userid, updatedUser.email);

    // Update refresh token hash
    await this.updateRTHash(updatedUser.userid, tokens.refreshToken);

    // Return the updated user data and tokens
    return {
      tokens,
      userID: updatedUser.userid,
      email: updatedUser.email,
      username: updatedUser.name,
      designation: updatedUser.designation,
    };
  }

  async remove(id: number) {
    const isUserExist = await this.databaseService.user.findFirst({
      where: {
        userid: id,
      },
    });

    if (!isUserExist)
      throw new NotFoundException(`User with id ${id} not found`);

    return await this.databaseService.user.delete({
      where: {
        userid: id,
      },
    });
  }

  // -------------------------Utility functions-----------------------------

  // Hashing the password with 12 rounds, data is DTO.password -> Prisma Model is DTO here
  // bcrypt lib is asynchronous, must use async/ await
  private async hashed(password: string) {
    const saltRounds = 12;
    const myPlaintextPassword = password;
    return bcrypt.hash(myPlaintextPassword, saltRounds);
  }

  // The method signature specifies that it returns a Promise
  //that resolves to an object with two properties: accessToken and refreshToken, both of type string.
  async getTokens(
    userID: number,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userID,
          email,
        },
        {
          secret: process.env.ACCESS_TOKEN_KEY,
          expiresIn: 60 * 15, // We are considering the access token will expire in 15 minutes
          // it will be refreshed every 15 minutes for security and go through the validation
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userID,
          email,
        },
        {
          secret: process.env.REQUEST_TOKEN,
          expiresIn: 60 * 15 * 24 * 7, // We are considering the refresh token will expire in 15 minutes
          // it will be refreshed every 7 for security and go through the validation, if not logged out
        },
      ),
    ]);

    return {
      // both returning tokens as strings
      accessToken,
      refreshToken,
    };
  }

  //Hashing the refresh token is typically done for security reasons, so that even if someone were to gain access to the database,
  //they wouldn't have direct access to the refresh token

  // Hence, we will be hashing the refreshed token and updating it on our dbs -> Admin table
  async updateRTHash(userID: number, refreshToken: string) {
    const hash = await this.hashed(refreshToken);

    await this.databaseService.user.update({
      where: {
        userid: userID,
      },
      data: {
        hashedRT: hash,
      },
    });
  }
}
