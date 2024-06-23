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
} from '@nestjs/common';
import { ConversionBdtService } from './conversion-bdt.service';
import { Prisma } from '@prisma/client';
import { Public } from '../decorator';

// @Public()
@Controller('conversion-bdt')
export class ConversionBdtController {
  constructor(private readonly conversionBdtService: ConversionBdtService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerConverstion(
    @Body() createConversionDTO: Prisma.conversionCreateInput,
  ) {
    return this.conversionBdtService.createConversion(createConversionDTO);
  }

  @Get('getOne/:month/:year')
  @HttpCode(HttpStatus.OK)
  async getOne_MonthYear(
    @Param('month', ParseIntPipe) month: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    return this.conversionBdtService.getOne_MonthYear(month, year);
  }

  @Get('getValue/:conversionID')
  async getValue_ID(@Param('conversionID', ParseIntPipe) conversionID: number) {
    return await this.conversionBdtService.getRate_ID(conversionID);
  }

  @Get('getAll')
  @HttpCode(HttpStatus.OK)
  async getAll() {
    return this.conversionBdtService.getAll();
  }

  @Put('update-conversion-rate/:id')
  async updateRate(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRateDTO: Prisma.conversionUpdateInput,
  ) {
    return this.conversionBdtService.updateRate(id, updateRateDTO);
  }
}
