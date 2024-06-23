import { Test, TestingModule } from '@nestjs/testing';
import { ParcelcalculationsService } from './parcelcalculations.service';

describe('ParcelcalculationsService', () => {
  let service: ParcelcalculationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParcelcalculationsService],
    }).compile();

    service = module.get<ParcelcalculationsService>(ParcelcalculationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
