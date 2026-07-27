import { FieldStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateFieldDto {
  @IsString()
  @IsNotEmpty({
    message: 'Mã sân không được để trống',
  })
  @MaxLength(30)
  code!: string;

  @IsString()
  @IsNotEmpty({
    message: 'Tên sân không được để trống',
  })
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl(
    {},
    {
      message: 'Đường dẫn hình ảnh không hợp lệ',
    },
  )
  imageUrl?: string;

  @IsOptional()
  @IsEnum(FieldStatus, {
    message: 'Trạng thái sân không hợp lệ',
  })
  status?: FieldStatus;

  @IsInt({
    message: 'Mã loại sân phải là số nguyên',
  })
  @Min(1, {
    message: 'Mã loại sân phải lớn hơn 0',
  })
  fieldTypeId!: number;
}
