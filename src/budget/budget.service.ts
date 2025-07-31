import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetEntity } from './budget.entity';
import { CurrencyService } from '../currency/currency.service';
import { BudgetCategory } from '../common/enums/budget-category.enum';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetService {
  constructor(
    @InjectRepository(BudgetEntity)
    private budgetRepository: Repository<BudgetEntity>,
    private currencyService: CurrencyService,
  ) {}

  async createBudget(
    userId: string,
    name: string,
    amount: number,
    currency: string,
    categories: BudgetCategory[],
    period: string = 'monthly',
    startDate?: Date,
    endDate?: Date,
  ): Promise<BudgetEntity> {
    // Validate date range if both dates are provided
    if (startDate && endDate && startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const budget = this.budgetRepository.create({
      userId,
      name,
      amount,
      currency,
      categories,
      period,
      startDate,
      endDate,
    });

    return this.budgetRepository.save(budget);
  }

  async getUserBudgets(userId: string): Promise<BudgetEntity[]> {
    return this.budgetRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getBudgetById(userId: string, budgetId: string): Promise<BudgetEntity> {
    const budget = await this.budgetRepository.findOne({
      where: { id: budgetId, userId },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    return budget;
  }

  async updateBudget(
    userId: string,
    budgetId: string,
    updateData: UpdateBudgetDto,
  ): Promise<BudgetEntity> {
    const budget = await this.getBudgetById(userId, budgetId);

    // Validate date range if updating dates
    if (
      updateData.startDate &&
      updateData.endDate &&
      updateData.startDate >= updateData.endDate
    ) {
      throw new BadRequestException('Start date must be before end date');
    }

    Object.assign(budget, updateData);
    return this.budgetRepository.save(budget);
  }

  async deleteBudget(userId: string, budgetId: string): Promise<void> {
    const budget = await this.getBudgetById(userId, budgetId);
    await this.budgetRepository.remove(budget);
  }

  async convertBudgetToCurrency(
    userId: string,
    budgetId: string,
    targetCurrency: string,
  ): Promise<number> {
    const budget = await this.getBudgetById(userId, budgetId);

    if (budget.currency === targetCurrency) {
      return budget.amount;
    }

    try {
      const convertedAmount = await this.currencyService.convertAmount(
        budget.currency,
        targetCurrency,
        budget.amount,
      );

      return convertedAmount;
    } catch (error) {
      throw new BadRequestException(
        `Failed to convert currency: ${error.message}`,
      );
    }
  }

  async getBudgetSummary(userId: string, baseCurrency: string = 'USD') {
    const budgets = await this.getUserBudgets(userId);

    if (budgets.length === 0) {
      return {
        total: 0,
        baseCurrency,
        budgets: [],
      };
    }

    const convertedBudgets = await Promise.all(
      budgets.map(async (budget) => {
        try {
          const convertedAmount = await this.convertBudgetToCurrency(
            userId,
            budget.id,
            baseCurrency,
          );

          return {
            ...budget,
            convertedAmount,
          };
        } catch (error) {
          // Log error but continue with original amount
          console.warn(
            `Failed to convert budget ${budget.id}: ${error.message}`,
          );
          return {
            ...budget,
            convertedAmount:
              budget.currency === baseCurrency ? budget.amount : 0,
          };
        }
      }),
    );

    const total = convertedBudgets.reduce(
      (sum, budget) => sum + budget.convertedAmount,
      0,
    );

    return {
      total: Math.round(total * 100) / 100, 
      baseCurrency,
      budgets: convertedBudgets,
    };
  }

  async getBudgetsByCategory(
    userId: string,
    category: BudgetCategory,
  ): Promise<BudgetEntity[]> {
    return this.budgetRepository
      .createQueryBuilder('budget')
      .where('budget.userId = :userId', { userId })
      .andWhere(':category = ANY(budget.categories)', { category })
      .getMany();
  }

  async getBudgetsByPeriod(
    userId: string,
    period: string,
  ): Promise<BudgetEntity[]> {
    return this.budgetRepository.find({
      where: { userId, period },
      order: { createdAt: 'DESC' },
    });
  }

  async getActiveBudgets(userId: string): Promise<BudgetEntity[]> {
    const now = new Date();

    return this.budgetRepository
      .createQueryBuilder('budget')
      .where('budget.userId = :userId', { userId })
      .andWhere('(budget.startDate IS NULL OR budget.startDate <= :now)', {
        now,
      })
      .andWhere('(budget.endDate IS NULL OR budget.endDate >= :now)', { now })
      .getMany();
  }
}
