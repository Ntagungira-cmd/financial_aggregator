import { IsOptional, IsString, Length } from "class-validator";
import { Transform } from "class-transformer";

export class GetRatesQueryDto {
  @IsOptional()
  @IsString()
  @Length(3, 3, { message: 'Base currency must be exactly 3 characters' })
  @Transform(({ value }) => value?.toUpperCase())
  base?: string = 'USD';
}