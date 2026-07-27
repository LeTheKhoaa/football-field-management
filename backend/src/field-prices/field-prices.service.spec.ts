import { Test, TestingModule } from '@nestjs/testing';
import { FieldPricesService } from './field-prices.service';

describe('FieldPricesService', () => {
  let service: FieldPricesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FieldPricesService],
    }).compile();

    service = module.get<FieldPricesService>(FieldPricesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
