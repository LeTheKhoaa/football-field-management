import { Test, TestingModule } from '@nestjs/testing';
import { FieldPricesController } from './field-prices.controller';
import { FieldPricesService } from './field-prices.service';

describe('FieldPricesController', () => {
  let controller: FieldPricesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FieldPricesController],
      providers: [FieldPricesService],
    }).compile();

    controller = module.get<FieldPricesController>(FieldPricesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
