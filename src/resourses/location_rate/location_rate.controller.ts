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
import { LocationRateService } from './location_rate.service';
import { Public } from '../decorator';
import { Prisma } from '@prisma/client';
import { query } from 'express';

// @Public()
@Controller('location-rate')
export class LocationRateController {
  constructor(private readonly locationRateService: LocationRateService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerLocation(
    @Body() createLocationDTO: Prisma.locationrateCreateInput,
  ) {
    return await this.locationRateService.registerLocation(createLocationDTO);
  }

  @Get('getAll')
  @HttpCode(HttpStatus.OK)
  async getAll() {
    return await this.locationRateService.showAllLocation();
  }

  @Get('getOne')
  async getOne_LocName(@Query() query: queryParams) {
    return await this.locationRateService.getOne_LocName(
      query.locationFrom,
      query.locationTo,
    );
  }

  @Get('getRate/:locationRate_id')
  async getRate_LocationID(
    @Param('locationRate_id', ParseIntPipe) locationRate_id: number,
  ) {
    return await this.locationRateService.getLocation_ID(locationRate_id);
  }

  @Put('updateLocationRate/:locationRate_id')
  @HttpCode(HttpStatus.OK)
  async updateLocationRate(
    @Param('locationRate_id', ParseIntPipe) locationRate_id: number,
    @Body() updateLocationDTO: Prisma.locationrateUpdateInput,
  ) {
    return await this.locationRateService.updateLocationInformation(
      locationRate_id,
      updateLocationDTO,
    );
  }
}
