import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetController } from './budget.controller';
import { BudgetEntity } from './budget.entity';
import { CurrencyModule } from '../currency/currency.module';
import { BudgetService } from './budget.service';

@Module({
  imports: [TypeOrmModule.forFeature([BudgetEntity]), CurrencyModule],
  providers: [BudgetService],
  controllers: [BudgetController],
})
export class BudgetModule {}
