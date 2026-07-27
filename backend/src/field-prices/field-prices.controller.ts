import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { FieldPricesService } from './field-prices.service';
import { CreateFieldPriceDto } from './dto/create-field-price.dto';
import { UpdateFieldPriceDto } from './dto/update-field-price.dto';

@Controller('field-prices')
export class FieldPricesController {
  constructor(private readonly fieldPricesService: FieldPricesService) {}

  @Post()
  create(@Body() createFieldPriceDto: CreateFieldPriceDto) {
    return this.fieldPricesService.create(createFieldPriceDto);
  }

  @Get()
  findAll() {
    return this.fieldPricesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fieldPricesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFieldPriceDto: UpdateFieldPriceDto,
  ) {
    return this.fieldPricesService.update(+id, updateFieldPriceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fieldPricesService.remove(+id);
  }
}
