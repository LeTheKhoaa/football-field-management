import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateFieldPriceDto {
  @Type(() => Number)
  @IsInt({
    message: 'Mã sân phải là số nguyên',
  })
  @Min(1, {
    message: 'Mã sân phải lớn hơn 0',
  })
  fieldId!: number;

  @Type(() => Number)
  @IsInt({
    message: 'Mã khung giờ phải là số nguyên',
  })
  @Min(1, {
    message: 'Mã khung giờ phải lớn hơn 0',
  })
  timeSlotId!: number;

  @Type(() => Number)
  @IsNumber(
    {
      maxDecimalPlaces: 2,
    },
    {
      message: 'Giá sân phải là một số hợp lệ',
    },
  )
  @Min(0, {
    message: 'Giá sân không được nhỏ hơn 0',
  })
  @IsNotEmpty({
    message: 'Giá sân không được để trống',
  })
  price!: number;
}
