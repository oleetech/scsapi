import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { PapercalculationService } from './papercalculation.service';
import { createPCR_DTO } from './dto/create-pcr.dto';
import { Public } from 'src/resourses/decorator';
import { createPCS_DTO } from './dto/create-pcs.dto';

// @Public()
@Controller('papercalculation')
export class PapercalculationController {
  constructor(
    private readonly papercalculationService: PapercalculationService,
  ) {}

  @Post('pcr')
  @HttpCode(HttpStatus.CREATED)
  async createPCR(@Body() createPCR_DTO: createPCR_DTO) {
    return this.papercalculationService.createPCR(createPCR_DTO);
  }

  @Post('pcs')
  @HttpCode(HttpStatus.CREATED)
  async createPCS(@Body() createPCS_DTO: createPCS_DTO) {
    return this.papercalculationService.createPCS(createPCS_DTO);
  }
}
