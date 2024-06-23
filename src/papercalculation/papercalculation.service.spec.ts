import { Test, TestingModule } from '@nestjs/testing';
import { PapercalculationService } from './papercalculation.service';

describe('PapercalculationService', () => {
  let service: PapercalculationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PapercalculationService],
    }).compile();

    service = module.get<PapercalculationService>(PapercalculationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
