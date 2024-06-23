import { Module } from '@nestjs/common';
import { PapercalculationService } from './papercalculation.service';
import { PapercalculationController } from './papercalculation.controller';

@Module({
  controllers: [PapercalculationController],
  providers: [PapercalculationService],
})
export class PapercalculationModule {}
