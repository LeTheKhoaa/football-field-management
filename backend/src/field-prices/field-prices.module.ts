import { Module } from '@nestjs/common';
import { FieldPricesService } from './field-prices.service';
import { FieldPricesController } from './field-prices.controller';

@Module({
  controllers: [FieldPricesController],
  providers: [FieldPricesService],
})
export class FieldPricesModule {}
