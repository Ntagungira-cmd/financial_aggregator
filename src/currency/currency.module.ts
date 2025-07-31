import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

import { CurrencyController } from './currency.controller';
import { CurrencyEntity } from './currency.entity';
import { CurrencyService } from './currency.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CurrencyEntity]),
    HttpModule.register({
      timeout: 10000, // 10 seconds timeout
      maxRedirects: 3,
    }),
    ConfigModule,
    CacheModule.register({
      ttl: 3600, // 1 hour default TTL
      max: 100, // Maximum number of items in cache
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
  ],
  providers: [CurrencyService],
  controllers: [CurrencyController],
  exports: [CurrencyService, TypeOrmModule],
})
export class CurrencyModule {}
