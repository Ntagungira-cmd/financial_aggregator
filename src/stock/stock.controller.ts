import {
  Controller,
  Get,
  Param,
  Query,
  HttpException,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { StockPriceEntity } from './stock.entity';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('quote/:symbol')
  async getStockQuote(@Param('symbol') symbol: string) {
    try {
      if (!symbol || symbol.trim().length === 0) {
        throw new HttpException(
          'Stock symbol is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const quote = await this.stockService.getStockQuote(symbol.toUpperCase());
      return {
        success: true,
        data: quote,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch stock quote',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('historical/:symbol')
  async getHistoricalData(
    @Param('symbol') symbol: string,
    @Query('days', new ParseIntPipe({ optional: true })) days: number = 30,
  ): Promise<{ success: boolean; data: StockPriceEntity[]; count: number }> {
    try {
      if (!symbol || symbol.trim().length === 0) {
        throw new HttpException(
          'Stock symbol is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (days < 1 || days > 365) {
        throw new HttpException(
          'Days must be between 1 and 365',
          HttpStatus.BAD_REQUEST,
        );
      }

      const historicalData = await this.stockService.getHistoricalData(
        symbol.toUpperCase(),
        days,
      );

      return {
        success: true,
        data: historicalData,
        count: historicalData.length,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch historical data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('market-indices')
  async getMarketIndices() {
    try {
      const indices = await this.stockService.getMarketIndices();
      return {
        success: true,
        data: {
          sp500: indices[0],
          dowJones: indices[1],
          nasdaq: indices[2],
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch market indices',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('search/:query')
  async searchStocks(@Param('query') query: string) {
    try {
      if (!query || query.trim().length < 2) {
        throw new HttpException(
          'Search query must be at least 2 characters long',
          HttpStatus.BAD_REQUEST,
        );
      }

      const results = await this.stockService.searchStocks(query);
      return {
        success: true,
        data: results,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to search stocks',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('trending')
  async getTrendingStocks() {
    try {
      const trending = await this.stockService.getTrendingStocks();
      return {
        success: true,
        data: trending,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch trending stocks',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}