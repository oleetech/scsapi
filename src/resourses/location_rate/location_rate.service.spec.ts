import { Test, TestingModule } from '@nestjs/testing';
import { LocationRateService } from './location_rate.service';

describe('LocationRateService', () => {
  let service: LocationRateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocationRateService],
    }).compile();

    service = module.get<LocationRateService>(LocationRateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
