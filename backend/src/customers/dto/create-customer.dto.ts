import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty({
    message: 'Họ tên không được để trống',
  })
  @MaxLength(100)
  fullName!: string;

  @IsString()
  @IsNotEmpty({
    message: 'Số điện thoại không được để trống',
  })
  @Matches(/^(0|\+84)[0-9]{9,10}$/, {
    message: 'Số điện thoại không hợp lệ',
  })
  phone!: string;

  @IsOptional()
  @IsEmail(
    {},
    {
      message: 'Email không hợp lệ',
    },
  )
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;
}
