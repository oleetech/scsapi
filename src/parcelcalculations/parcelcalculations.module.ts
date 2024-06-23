import { Module } from '@nestjs/common';
import { ParcelcalculationsService } from './parcelcalculations.service';
import { ParcelcalculationsController } from './parcelcalculations.controller';

@Module({
  controllers: [ParcelcalculationsController],
  providers: [ParcelcalculationsService],
})
export class ParcelcalculationsModule {}
