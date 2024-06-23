import { Test, TestingModule } from '@nestjs/testing';
import { ParcelrateController } from './parcelrate.controller';
import { ParcelrateService } from './parcelrate.service';

describe('ParcelrateController', () => {
  let controller: ParcelrateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParcelrateController],
      providers: [ParcelrateService],
    }).compile();

    controller = module.get<ParcelrateController>(ParcelrateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
