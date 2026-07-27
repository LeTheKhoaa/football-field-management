import { PartialType } from '@nestjs/mapped-types';
import { CreateFieldTypeDto } from './create-field-type.dto';

export class UpdateFieldTypeDto extends PartialType(CreateFieldTypeDto) {}
