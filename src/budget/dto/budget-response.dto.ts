import { ApiProperty } from '@nestjs/swagger';

export class BudgetResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the budget',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the budget',
    example: 'Monthly Expenses',
  })
  name: string;

  @ApiProperty({
    description: 'Amount allocated for the budget',
    example: 1000,
  })
  amount: number;

  @ApiProperty({
    description: 'Currency of the budget',
    example: 'USD',
  })
  currency: string;

  @ApiProperty({
    description: 'Categories associated with the budget',
    example: ['Food', 'Transport', 'Utilities'],
  })
  categories: string[];

  @ApiProperty({
    description: 'Period for which the budget is set',
    example: 'monthly',
  })
  period: string;

  @ApiProperty({
    description: 'Creation date of the budget',
    example: '2023-10-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last updated date of the budget',
    example: '2023-10-15T00:00:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Start date of the budget period',
    example: '2023-10-01T00:00:00Z',
  })
  startDate?: Date;

  @ApiProperty({
    description: 'End date of the budget period',
    example: '2023-10-31T23:59:59Z',
  })
  endDate?: Date;
}
