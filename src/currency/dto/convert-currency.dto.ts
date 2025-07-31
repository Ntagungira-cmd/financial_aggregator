import { Type, Transform } from 'class-transformer';
import { IsString, Length, IsNumber, Min } from 'class-validator';

export class ConvertCurrencyDto {
  @IsString()
  @Length(3, 3, { message: 'From currency must be exactly 3 characters' })
  @Transform(({ value }) => value?.toUpperCase())
  from: string;

  @IsString()
  @Length(3, 3, { message: 'To currency must be exactly 3 characters' })
  @Transform(({ value }) => value?.toUpperCase())
  to: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;
}
