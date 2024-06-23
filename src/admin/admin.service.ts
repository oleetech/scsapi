import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from 'src/dbs_config/database/database.service';
import * as bcrypt from 'bcrypt';
import { Token } from 'src/authentication/types';
import { JwtService } from '@nestjs/jwt';
import { NotFoundError } from 'rxjs';

@Injectable()
export class AdminService {
  constructor(
    private readonly databaseService: DatabaseService,
    private jwtService: JwtService,
  ) {}

  // validates existence -> hashes password -> creates a new user -> creates payload tokens
  // -> hashes refresh token -> updates Admin table w/ hashed refreshed token
  async create(createAdminDto: Prisma.AdminCreateInput): Promise<{
    tokens: Token;
    adminID: Number;
    email: string;
    username: string;
  }> {
    // Validating if the user w/ unique email exists or not
    const result = await this.databaseService.admin.findFirst({
      where: {
        email: createAdminDto.email,
      },
    });

    if (result) {
      throw new ForbiddenException(
        `${createAdminDto.email} already registered.`,
      );
    }

    const hashedPassword = await this.hashData(createAdminDto.password);

    const newUser = await this.databaseService.admin.create({
      data: {
        email: createAdminDto.email,
        password: hashedPassword,
        name: createAdminDto.name,
      },
    });

    const tokens = await this.getTokens(newUser.adminid, newUser.email);

    await this.updateRTHash(newUser.adminid, tokens.refreshToken);

    const data = {
      tokens,
      adminID: newUser.adminid,
    };

    return {
      tokens,
      adminID: newUser.adminid,
      email: newUser.email,
      username: newUser.name,
    };
  }

  // validates existence -> validates passwords -> tokenizes both access token & refresh token
  // updates refresh token -> returns tokens
  async signinLocal(adminDTO: { email: string; password: string }): Promise<{
    tokens: Token;
    adminID: Number;
    email: string;
    username: string;
  }> {
    const isUserExist = await this.databaseService.admin.findFirst({
      where: {
        email: adminDTO.email,
      },
    });

    if (!isUserExist)
      throw new ForbiddenException(
        `Access Denied: ${adminDTO.email} is not registered as admin.`,
      );

    const isPasswordMatch = await bcrypt.compare(
      adminDTO.password,
      isUserExist.password,
    );
    if (!isPasswordMatch)
      throw new ForbiddenException(
        `Access Denied: ${adminDTO.email}'s password does not match.`,
      );

    const tokens = await this.getTokens(isUserExist.adminid, isUserExist.email);

    await this.updateRTHash(isUserExist.adminid, tokens.refreshToken);

    return {
      tokens,
      adminID: isUserExist.adminid,
      email: isUserExist.email,
      username: isUserExist.name,
    };
  }

  async logout(userID: number) {
    // https://stackoverflow.com/questions/62799708/nest-js-auth-guard-jwt-authentication-constantly-returns-401-unauthorized
    await this.databaseService.admin.update({
      where: {
        adminid: userID,
        hashedRT: {
          not: null, // Will only get the user w/ userID that has a hashRT in DBS
        },
      },
      data: {
        hashedRT: null,
      },
    });

    console.log(
      await this.databaseService.admin.findFirst({
        where: {
          adminid: userID,
        },
      }),
    );
  }

  async refreshTokens(
    adminID: number,
    // refreshToken: string
  ) {
    const user = await this.databaseService.admin.findUnique({
      where: {
        adminid: adminID,
      },
    });

    if (!user || !user.hashedRT) throw new UnauthorizedException();

    // const isRTMatch = bcrypt.compare(refreshToken, user.hashedRT);

    // if (!isRTMatch)
    //   throw new ForbiddenException(`Access Denied: Refresh Token did not match`);

    const tokens = await this.getTokens(user.adminid, user.email);
    await this.updateRTHash(user.adminid, tokens.refreshToken);

    return tokens;
  }

  async findAll() {
    return await this.databaseService.admin.findMany({
      select: {
        adminid: true,
        name: true,
        email: true,
      },
    });
  }

  async findOne(id: number) {
    const result = await this.databaseService.admin.findUnique({
      where: {
        adminid: id,
      },
      select: {
        adminid: true,
        name: true,
        email: true,
      },
    });

    if (!result) {
      return HttpStatus.NOT_FOUND;
    }

    return result;
  }

  async update(id: number, updateAdminDto: Prisma.AdminUpdateInput) {
    // Check if all required fields are strings
    if (
      typeof updateAdminDto.email !== 'string' ||
      typeof updateAdminDto.password !== 'string' ||
      typeof updateAdminDto.name !== 'string'
    ) {
      throw new BadRequestException();
    }

    // Check if the admin with the provided ID exists
    const existingAdmin = await this.databaseService.admin.findFirst({
      where: { adminid: id },
    });

    if (!existingAdmin) {
      throw new BadRequestException(`Admin with ID ${id} does not exist`);
    }

    // Check if the email already exists in the database and belongs to a different admin
    const adminWithSameEmail = await this.databaseService.admin.findFirst({
      where: { email: updateAdminDto.email },
    });

    if (adminWithSameEmail && adminWithSameEmail.adminid !== id) {
      throw new ForbiddenException(`${updateAdminDto.email} already exists`);
    }

    // Hash the password
    const hashedPassword = await this.hashData(updateAdminDto.password);

    // Update the admin details
    const updatedAdmin = await this.databaseService.admin.update({
      where: { adminid: id },
      data: {
        name: updateAdminDto.name,
        email: updateAdminDto.email,
        password: hashedPassword,
      },
    });

    // Generate tokens
    const tokens = await this.getTokens(
      updatedAdmin.adminid,
      updatedAdmin.email,
    );

    // Update refresh token hash
    await this.updateRTHash(updatedAdmin.adminid, tokens.refreshToken);

    // Return the updated admin data and tokens
    return {
      tokens,
      adminID: updatedAdmin.adminid,
      email: updatedAdmin.email,
      username: updatedAdmin.name,
    };
  }

  remove(id: number) {
    return this.databaseService.admin.delete({
      where: {
        adminid: id,
      },
    });
  }

  // ------------------------------------------------------
  // Utility functions

  // Hashing the password with 12 rounds, data is DTO.password -> Prisma Model is DTO here
  // bcrypt lib is asynchronous, must use async/ await
  private async hashData(data: string): Promise<string> {
    const saltRounds = 12;
    const myPlaintextPassword = data;
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
    const hash = await this.hashData(refreshToken);

    await this.databaseService.admin.update({
      where: {
        adminid: userID,
      },
      data: {
        hashedRT: hash,
      },
    });
  }
}
