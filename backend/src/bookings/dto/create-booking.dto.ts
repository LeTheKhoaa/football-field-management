import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateBookingItemDto } from './create-booking-item.dto';

export class CreateBookingDto {
  @Type(() => Number)
  @IsInt({
    message: 'Mã khách hàng phải là số nguyên',
  })
  @Min(1, {
    message: 'Mã khách hàng phải lớn hơn 0',
  })
  customerId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    {
      maxDecimalPlaces: 2,
    },
    {
      message: 'Tiền cọc phải là một số hợp lệ',
    },
  )
  @Min(0, {
    message: 'Tiền cọc không được nhỏ hơn 0',
  })
  depositAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @IsArray({
    message: 'Danh sách sân đặt phải là một mảng',
  })
  @ArrayMinSize(1, {
    message: 'Phải chọn ít nhất một sân và khung giờ',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateBookingItemDto)
  items!: CreateBookingItemDto[];
}
