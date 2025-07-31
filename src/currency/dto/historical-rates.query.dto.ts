import { Type } from 'class-transformer';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';

export class HistoricalRatesQueryDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1, { message: 'Days must be at least 1' })
  @Max(365, { message: 'Days cannot exceed 365' })
  days?: number = 30;
}
