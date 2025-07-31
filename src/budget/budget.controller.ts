import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  ParseUUIDPipe,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { BudgetSummaryResponseDto } from './dto/budget-summary-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BudgetResponseDto } from './dto/budget-response.dto';

@Controller('budget')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  async createBudget(
    @Request() req,
    @Body() createBudgetDto: CreateBudgetDto,
  ): Promise<BudgetResponseDto> {
    const budget = await this.budgetService.createBudget(
      req.user.id,
      createBudgetDto.name,
      createBudgetDto.amount,
      createBudgetDto.currency,
      createBudgetDto.categories,
      createBudgetDto.period,
      createBudgetDto.startDate,
      createBudgetDto.endDate,
    );

    return this.mapToResponseDto(budget);
  }

  @Get()
  async getUserBudgets(@Request() req): Promise<BudgetResponseDto[]> {
    const budgets = await this.budgetService.getUserBudgets(req.user.id);
    return budgets.map((budget) => this.mapToResponseDto(budget));
  }

  @Get('summary')
  async getBudgetSummary(
    @Request() req,
    @Query('currency') baseCurrency: string = 'USD',
  ): Promise<BudgetSummaryResponseDto> {
    return this.budgetService.getBudgetSummary(req.user.id, baseCurrency);
  }

  @Get(':id')
  async getBudgetById(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BudgetResponseDto> {
    const budget = await this.budgetService.getBudgetById(req.user.id, id);
    return this.mapToResponseDto(budget);
  }

  @Put(':id')
  async updateBudget(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ): Promise<BudgetResponseDto> {
    const budget = await this.budgetService.updateBudget(
      req.user.id,
      id,
      updateBudgetDto,
    );
    return this.mapToResponseDto(budget);
  }

  @Delete(':id')
  async deleteBudget(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    await this.budgetService.deleteBudget(req.user.id, id);
    return { message: 'Budget deleted successfully' };
  }

  @Get(':id/convert')
  async convertBudget(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('currency') targetCurrency: string,
  ): Promise<{ convertedAmount: number; targetCurrency: string }> {
    const convertedAmount = await this.budgetService.convertBudgetToCurrency(
      req.user.id,
      id,
      targetCurrency,
    );

    return {
      convertedAmount,
      targetCurrency,
    };
  }

  private mapToResponseDto(budget: any): BudgetResponseDto {
    return {
      id: budget.id,
      name: budget.name,
      amount: budget.amount,
      currency: budget.currency,
      categories: budget.categories,
      period: budget.period,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
      startDate: budget.startDate,
      endDate: budget.endDate,
    };
  }
}
