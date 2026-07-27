import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    example: 1,
    description: 'Mã đơn đặt sân',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  bookingId!: number;

  @ApiProperty({
    example: 100000,
    description: 'Số tiền thanh toán',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiPropertyOptional({
    example: 'FT20260727001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  transactionCode?: string;

  @ApiPropertyOptional({
    example: 'Khách thanh toán tiền cọc',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
