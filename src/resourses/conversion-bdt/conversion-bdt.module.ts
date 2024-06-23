import { Module } from '@nestjs/common';
import { ConversionBdtService } from './conversion-bdt.service';
import { ConversionBdtController } from './conversion-bdt.controller';

@Module({
  controllers: [ConversionBdtController],
  providers: [ConversionBdtService],
})
export class ConversionBdtModule {}
