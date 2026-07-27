import { Module } from '@nestjs/common';
import { FieldTypesService } from './field-types.service';
import { FieldTypesController } from './field-types.controller';

@Module({
  controllers: [FieldTypesController],
  providers: [FieldTypesService],
})
export class FieldTypesModule {}
