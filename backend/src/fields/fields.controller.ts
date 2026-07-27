import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { FieldStatus } from '@prisma/client';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { FieldsService } from './fields.service';

@Controller('fields')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Post()
  create(@Body() dto: CreateFieldDto) {
    return this.fieldsService.create(dto);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('fieldTypeId') fieldTypeId?: string,
    @Query('status', new ParseEnumPipe(FieldStatus, { optional: true }))
    status?: FieldStatus,
  ) {
    return this.fieldsService.findAll(
      search,
      fieldTypeId ? Number(fieldTypeId) : undefined,
      status,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fieldsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFieldDto) {
    return this.fieldsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.fieldsService.remove(id);
  }
}
