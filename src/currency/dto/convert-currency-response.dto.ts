import { ApiProperty } from '@nestjs/swagger';
export class ConvertCurrencyResponseDto {
  @ApiProperty({
    description: 'Indicates whether the conversion was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Data containing conversion details',
    type: Object,
    example: {
      from: 'USD',
      to: 'EUR',
      originalAmount: 100,
      convertedAmount: 92,
      rate: 0.92,
      timestamp: '2024-06-01T12:00:00Z',
    },
  })
  data: {
    from: string;
    to: string;
    originalAmount: number;
    convertedAmount: number;
    rate: number;
    timestamp: string;
  };
}
