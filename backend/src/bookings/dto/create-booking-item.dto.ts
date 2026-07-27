import { Type } from 'class-transformer';
import { IsDateString, IsInt, Min } from 'class-validator';

export class CreateBookingItemDto {
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

  @IsDateString(
    {},
    {
      message: 'Ngày đá không hợp lệ',
    },
  )
  playDate!: string;
}
