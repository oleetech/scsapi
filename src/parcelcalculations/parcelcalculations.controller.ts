import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ParcelcalculationsService } from './parcelcalculations.service';
import { Public } from 'src/resourses/decorator';
import { Prisma } from '@prisma/client';
import { createSCR_DTO } from './dto/create-SCR.dto';
import { createSPXPP_DTO } from './dto/create-SPXPP.dto';
import { createSCS_DTO } from './dto/create-SCS.dto';

// @Public()
@Controller('parcelcalculations')
export class ParcelcalculationsController {
  constructor(
    private readonly parcelcalculationsService: ParcelcalculationsService,
  ) {}

  @Post('scr')
  async createParcelRate(@Body() createSCR_DTO: createSCR_DTO) {
    return this.parcelcalculationsService.createSCR(createSCR_DTO);
  }

  @Post('spx-pp')
  async createSPX_PP(@Body() createSPX_PP: createSPXPP_DTO) {
    return this.parcelcalculationsService.createSPX_PP(createSPX_PP);
  }

  @Post('scs')
  async createSCS(@Body() createSCS_DTO: createSCS_DTO) {
    console.log(createSCS_DTO);

    return this.parcelcalculationsService.createSCS(createSCS_DTO);
  }

  @Get('getParcel/:location/:weight')
  async getParcelRate(
    @Param('location') location: string,
    @Param('weight', ParseIntPipe) weight: number,
  ) {
    return this.parcelcalculationsService.getParcelRate(location, weight);
  }
}
