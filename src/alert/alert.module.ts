import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertController } from './alert.controller';
import { AlertEntity } from './alert.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { StockModule } from '../stock/stock.module';
import { CurrencyModule } from '../currency/currency.module';
import { AlertService } from './alert.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AlertEntity]),
    StockModule,
    CurrencyModule,
  ],
  providers: [AlertService],
  controllers: [AlertController],
})
export class AlertModule {}
