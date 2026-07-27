import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateTimeSlotDto {
  @IsString()
  @IsNotEmpty({
    message: 'Tên khung giờ không được để trống',
  })
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty({
    message: 'Giờ bắt đầu không được để trống',
  })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Giờ bắt đầu phải có định dạng HH:mm',
  })
  startTime!: string;

  @IsString()
  @IsNotEmpty({
    message: 'Giờ kết thúc không được để trống',
  })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Giờ kết thúc phải có định dạng HH:mm',
  })
  endTime!: string;
}
