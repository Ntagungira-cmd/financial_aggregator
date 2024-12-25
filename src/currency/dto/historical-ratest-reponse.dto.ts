import { ApiProperty } from "@nestjs/swagger";

export class HistoricalRateDto {
  @ApiProperty({ description: 'Exchange rate', example: 1.2 })
  rate: number;

  @ApiProperty({ description: 'Timestamp of the rate', example: '2023-01-01T00:00:00Z' })
  timestamp: Date;

  @ApiProperty({ description: 'Source of the rate', example: 'API' })
  source: string;
}

export class HistoricalRatesDataDto {
  @ApiProperty({ description: 'Base currency code', example: 'USD' })
  base: string | undefined;

  @ApiProperty({ description: 'Target currency code', example: 'EUR' })
  target: string | undefined;

  @ApiProperty({ description: 'Number of days for historical data', example: 30 })
  days: number | undefined;

  @ApiProperty({ description: 'Array of historical rates', type: [HistoricalRateDto] })
  rates: HistoricalRateDto[];
}

export class HistoricalRatesResponseDto {
  @ApiProperty({ description: 'Indicates if the request was successful', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Data containing historical rates information',
    type: HistoricalRatesDataDto,
  })
  data: HistoricalRatesDataDto;
}
