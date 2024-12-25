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
  HttpCode,
} from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { BudgetSummaryResponseDto } from './dto/budget-summary-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BudgetResponseDto } from './dto/budget-response.dto';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Budget')
@ApiBearerAuth()
@Controller('budget')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new budget' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The budget has been successfully created.',
    type: BudgetResponseDto,
  })
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
  @ApiOperation({ summary: 'Get all budgets for the authenticated user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all budgets for the user.',
    type: [BudgetResponseDto],
  })
  async getUserBudgets(@Request() req): Promise<BudgetResponseDto[]> {
    const budgets = await this.budgetService.getUserBudgets(req.user.id);
    return budgets.map((budget) => this.mapToResponseDto(budget));
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get budget summary for the authenticated user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the budget summary for the user.',
    type: BudgetSummaryResponseDto,
  })
  async getBudgetSummary(
    @Request() req,
    @Query('currency') baseCurrency: string = 'USD',
  ): Promise<BudgetSummaryResponseDto> {
    return this.budgetService.getBudgetSummary(req.user.id, baseCurrency);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific budget by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the budget with the specified ID.',
    type: BudgetResponseDto,
  })
  async getBudgetById(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BudgetResponseDto> {
    const budget = await this.budgetService.getBudgetById(req.user.id, id);
    return this.mapToResponseDto(budget);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a budget by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The budget has been successfully updated.',
    type: BudgetResponseDto,
  })
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
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a budget by ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The budget has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The budget has been successfully deleted.',
  })
  async deleteBudget(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    await this.budgetService.deleteBudget(req.user.id, id);
    return { message: 'Budget deleted successfully' };
  }

  @Get(':id/convert')
  @ApiOperation({ summary: 'Convert budget amount to a different currency' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the converted amount in the target currency.',
    type: BudgetResponseDto,
  })
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
