import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsString, Length, IsNumber, Min } from 'class-validator';

export class ConvertCurrencyDto {
  @IsString()
  @Length(3, 3, { message: 'From currency must be exactly 3 characters' })
  @Transform(({ value }) => value?.toUpperCase())
  @ApiProperty({
    description:
      'The currency code to convert from, must be exactly 3 characters',
    example: 'USD',
  })
  from: string;

  @IsString()
  @Length(3, 3, { message: 'To currency must be exactly 3 characters' })
  @Transform(({ value }) => value?.toUpperCase())
  @ApiProperty({
    description:
      'The currency code to convert to, must be exactly 3 characters',
    example: 'EUR',
  })
  to: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0.01, { message: 'Amount must be greater than 0' })
  @ApiProperty({
    description: 'The amount of currency to convert, must be greater than 0',
    example: 100,
  })
  amount: number;
}
