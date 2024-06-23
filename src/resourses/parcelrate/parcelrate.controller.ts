import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ParcelrateService } from './parcelrate.service';
import { Public } from '../decorator';
import { Prisma } from '@prisma/client';
import { query } from 'express';

// @Public()
@Controller('parcelrate')
export class ParcelrateController {
  constructor(private readonly parcelrateService: ParcelrateService) {}

  @Post()
  async registerParcelRate(
    @Body() createParcelRate_DTO: Prisma.parcelrateCreateInput,
  ) {
    return this.parcelrateService.registerParcelRate(createParcelRate_DTO);
  }

  @Get('getOne')
  async getOne_Loc_Weight(@Query() query: parcelrateGetOne) {
    return await this.parcelrateService.getOneParcelRate(
      query.location,
      query.weight,
    );
  }

  @Get('getRate/:id')
  async getRate_parcelID(@Param('id', ParseIntPipe) parcelrate_id: number) {
    return await this.parcelrateService.getRate_ParcelID(parcelrate_id);
  }

  @Get('getAll')
  async getAllParcelRate() {
    return await this.parcelrateService.showAllParcelRate();
  }

  @Put('update/:parcelRateID')
  @HttpCode(HttpStatus.OK)
  async updateParcelRate(
    @Param('parcelRateID', ParseIntPipe) parcelRateID: number,
    @Body() updateParcelRate_DTO: Prisma.parcelrateUpdateInput,
  ) {
    return this.parcelrateService.updateParcelRate(
      parcelRateID,
      updateParcelRate_DTO,
    );
  }
}
