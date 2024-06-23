import { Test, TestingModule } from '@nestjs/testing';
import { ConversionBdtService } from './conversion-bdt.service';

describe('ConversionBdtService', () => {
  let service: ConversionBdtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConversionBdtService],
    }).compile();

    service = module.get<ConversionBdtService>(ConversionBdtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
