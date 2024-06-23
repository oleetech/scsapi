import { Module } from '@nestjs/common';
import { LocationRateService } from './location_rate.service';
import { LocationRateController } from './location_rate.controller';

@Module({
  controllers: [LocationRateController],
  providers: [LocationRateService],
})
export class LocationRateModule {}
