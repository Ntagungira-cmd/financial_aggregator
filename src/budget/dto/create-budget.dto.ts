import {
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  IsOptional,
  Min,
  MaxLength,
  IsISO4217CurrencyCode,
} from 'class-validator';
import { BudgetCategory } from '../../common/enums/budget-category.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBudgetDto {
  @IsString()
  @MaxLength(100)
  @ApiProperty({
    description: 'Name of the budget',
    example: 'Monthly Expenses',
  })
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @ApiProperty({
    description: 'Amount allocated for the budget',
    example: 1000,
  })
  amount: number;

  @IsISO4217CurrencyCode()
  @ApiProperty({
    description: 'Currency of the budget',
    example: 'USD',
  })
  currency: string;

  @IsArray()
  @IsEnum(BudgetCategory, { each: true })
  @ApiProperty({
    description: 'Categories associated with the budget',
    example: ['food', 'transportation', 'utilities'],
    isArray: true,
    enum: BudgetCategory,
  })
  categories: BudgetCategory[];

  @IsOptional()
  @IsString()
  @IsEnum(['weekly', 'monthly', 'yearly'])
  @ApiProperty({
    description: 'Period for which the budget is set',
    example: 'monthly',
  })
  period?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Start date of the budget period',
    example: '2023-10-01T00:00:00Z',
  })
  startDate?: Date;

  @IsOptional()
  @ApiProperty({
    description: 'End date of the budget period',
    example: '2023-10-31T23:59:59Z',
  })
  endDate?: Date;
}
