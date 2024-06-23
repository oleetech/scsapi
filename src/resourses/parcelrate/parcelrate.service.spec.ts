import { Test, TestingModule } from '@nestjs/testing';
import { ParcelrateService } from './parcelrate.service';

describe('ParcelrateService', () => {
  let service: ParcelrateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParcelrateService],
    }).compile();

    service = module.get<ParcelrateService>(ParcelrateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
