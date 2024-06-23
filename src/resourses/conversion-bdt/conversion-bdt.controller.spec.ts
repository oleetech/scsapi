import { Test, TestingModule } from '@nestjs/testing';
import { ConversionBdtController } from './conversion-bdt.controller';
import { ConversionBdtService } from './conversion-bdt.service';

describe('ConversionBdtController', () => {
  let controller: ConversionBdtController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversionBdtController],
      providers: [ConversionBdtService],
    }).compile();

    controller = module.get<ConversionBdtController>(ConversionBdtController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
