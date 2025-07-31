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

export class CreateBudgetDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsISO4217CurrencyCode()
  currency: string;

  @IsArray()
  @IsEnum(BudgetCategory, { each: true })
  categories: BudgetCategory[];

  @IsOptional()
  @IsString()
  @IsEnum(['weekly', 'monthly', 'yearly'])
  period?: string;

  @IsOptional()
  startDate?: Date;

  @IsOptional()
  endDate?: Date;
}