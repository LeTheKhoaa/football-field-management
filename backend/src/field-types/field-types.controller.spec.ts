import { Test, TestingModule } from '@nestjs/testing';
import { FieldTypesController } from './field-types.controller';
import { FieldTypesService } from './field-types.service';

describe('FieldTypesController', () => {
  let controller: FieldTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FieldTypesController],
      providers: [FieldTypesService],
    }).compile();

    controller = module.get<FieldTypesController>(FieldTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
