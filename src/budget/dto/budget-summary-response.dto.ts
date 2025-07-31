import { ApiProperty } from '@nestjs/swagger';
import { BudgetResponseDto } from './budget-response.dto';

export class BudgetSummaryResponseDto {
  @ApiProperty({
    description: 'Total amount of all budgets in the summary',
    example: 5000,
  })
  total: number;

  @ApiProperty({
    description: 'Base currency of the budget summary',
    example: 'USD',
  })
  baseCurrency: string;

  @ApiProperty({
    description: 'List of budgets with their converted amounts',
    type: [BudgetResponseDto],
  })
  budgets: Array<BudgetResponseDto & { convertedAmount: number }>;
}
