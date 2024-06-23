import { Test, TestingModule } from '@nestjs/testing';
import { ParcelcalculationsController } from './parcelcalculations.controller';
import { ParcelcalculationsService } from './parcelcalculations.service';

describe('ParcelcalculationsController', () => {
  let controller: ParcelcalculationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParcelcalculationsController],
      providers: [ParcelcalculationsService],
    }).compile();

    controller = module.get<ParcelcalculationsController>(ParcelcalculationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
