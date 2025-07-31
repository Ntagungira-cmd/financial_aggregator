export class BudgetResponseDto {
  id: string;
  name: string;
  amount: number;
  currency: string;
  categories: string[];
  period: string;
  createdAt: Date;
  updatedAt: Date;
  startDate?: Date;
  endDate?: Date;
}

