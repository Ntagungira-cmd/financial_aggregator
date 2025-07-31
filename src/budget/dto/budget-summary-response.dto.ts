import { BudgetResponseDto } from './budget-response.dto';

export class BudgetSummaryResponseDto {
  total: number;
  baseCurrency: string;
  budgets: Array<BudgetResponseDto & { convertedAmount: number }>;
}
