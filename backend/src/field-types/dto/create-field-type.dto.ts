import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFieldTypeDto {
  @IsString({
    message: 'Tên loại sân phải là chuỗi',
  })
  @IsNotEmpty({
    message: 'Tên loại sân không được để trống',
  })
  @MaxLength(100, {
    message: 'Tên loại sân không được vượt quá 100 ký tự',
  })
  name!: string;

  @IsOptional()
  @IsString({
    message: 'Mô tả phải là chuỗi',
  })
  @MaxLength(1000, {
    message: 'Mô tả không được vượt quá 1000 ký tự',
  })
  description?: string;
}
