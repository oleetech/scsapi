import { Module } from '@nestjs/common';
import { ParcelrateService } from './parcelrate.service';
import { ParcelrateController } from './parcelrate.controller';

@Module({
  controllers: [ParcelrateController],
  providers: [ParcelrateService],
})
export class ParcelrateModule {}
