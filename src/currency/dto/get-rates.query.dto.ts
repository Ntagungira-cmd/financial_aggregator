import { IsOptional, IsString, Length } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class GetRatesQueryDto {
  @IsOptional()
  @IsString()
  @Length(3, 3, { message: 'Base currency must be exactly 3 characters' })
  @Transform(({ value }) => value?.toUpperCase())
  @ApiProperty({
    description: 'The base currency code for the rates, must be exactly 3 characters',
    example: 'USD',
  })
  base?: string = 'USD';
}