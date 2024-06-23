import { Test, TestingModule } from '@nestjs/testing';
import { LocationRateController } from './location_rate.controller';
import { LocationRateService } from './location_rate.service';

describe('LocationRateController', () => {
  let controller: LocationRateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationRateController],
      providers: [LocationRateService],
    }).compile();

    controller = module.get<LocationRateController>(LocationRateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
