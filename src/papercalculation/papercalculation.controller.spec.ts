import { Test, TestingModule } from '@nestjs/testing';
import { PapercalculationController } from './papercalculation.controller';
import { PapercalculationService } from './papercalculation.service';

describe('PapercalculationController', () => {
  let controller: PapercalculationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PapercalculationController],
      providers: [PapercalculationService],
    }).compile();

    controller = module.get<PapercalculationController>(PapercalculationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
