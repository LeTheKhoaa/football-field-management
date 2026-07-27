import { BookingStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus, {
    message: 'Trạng thái đơn đặt sân không hợp lệ',
  })
  status!: BookingStatus;
}
