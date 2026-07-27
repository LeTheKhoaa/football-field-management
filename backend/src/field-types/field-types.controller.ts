import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateFieldTypeDto } from './dto/create-field-type.dto';
import { UpdateFieldTypeDto } from './dto/update-field-type.dto';
import { FieldTypesService } from './field-types.service';

@Controller('field-types')
export class FieldTypesController {
  constructor(private readonly fieldTypesService: FieldTypesService) {}

  @Post()
  create(@Body() dto: CreateFieldTypeDto) {
    return this.fieldTypesService.create(dto);
  }

  @Get()
  findAll() {
    return this.fieldTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fieldTypesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFieldTypeDto,
  ) {
    return this.fieldTypesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.fieldTypesService.remove(id);
  }
}
