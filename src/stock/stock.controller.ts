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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { time } from 'console';

@ApiTags('stock')
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('quote/:symbol')
  @ApiOperation({
    summary: 'Get stock quote by symbol',
    description: 'Fetches the current stock quote for the given symbol.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the stock quote data.',
    schema: {
      example: {
        success: true,
        data: {
          symbol: 'AAPL',
          open: 150.0,
          high: 155.0,
          low: 149.0,
          price: 153.0,
          volume: 1000000,
          latestTradingDay: '2024-06-01',
          previousClose: 151.0,
          change: 2.0,
          changePercent: '1.32%',
        },
        timestamp: '2024-06-01T12:00:00.000Z',
      },
    },
  })
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
  @ApiOperation({
    summary: 'Get historical stock data',
    description: 'Fetches historical stock data for the given symbol.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns historical stock data.',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 'b7e6c8e2-1234-4f8a-9b2e-123456789abc',
            symbol: 'AAPL',
            price: 153.0,
            open: 150.0,
            high: 155.0,
            low: 149.0,
            volume: 1000000,
            change: 2.0,
            changePercent: 1.32,
            timestamp: '2024-06-01T12:00:00.000Z',
            companyName: 'Apple Inc.',
            source: 'alpha-vantage',
            latestTradingDay: '2024-06-01',
            previousClose: 151.0,
          },
        ],
        count: 30,
      },
    },
  })
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
  @ApiOperation({
    summary: 'Get market indices',
    description:
      'Fetches current market indices like S&P 500, Dow Jones, and NASDAQ.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns current market indices.',
    schema: {
      example: {
        success: true,
        data: {
          sp500: {
            symbol: 'SPX',
            price: 4500,
            change: 50,
            changePercent: '1.12%',
          },
          dowJones: {
            symbol: 'DJI',
            price: 35000,
            change: 200,
            changePercent: '0.57%',
          },
          nasdaq: {
            symbol: 'IXIC',
            price: 15000,
            change: 100,
            changePercent: '0.67%',
          },
        },
        timestamp: '2024-06-01T12:00:00.000Z',
      },
    },
  })
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
  @ApiOperation({
    summary: 'Search stocks by query',
    description: 'Searches for stocks based on the provided query string.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns search results for stocks.',
    schema: {
      example: {
        success: true,
        data: [
          {
            symbol: 'AAPL',
            name: 'Apple Inc.',
            type: 'Equity',
            region: 'US',
            marketOpen: '09:30',
            marketClose: '16:00',
            timezone: 'America/New_York',
            currency: 'USD',
            matchScore: '0.95',
          },
          {
            symbol: 'GOOGL',
            name: 'Alphabet Inc.',
            type: 'Equity',
            region: 'US',
            marketOpen: '09:30',
            marketClose: '16:00',
            timezone: 'America/New_York',
            currency: 'USD',
            matchScore: '0.90',
          },
        ],
        timestamp: '2024-06-01T12:00:00.000Z',
      },
    },
  })
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
  @ApiOperation({
    summary: 'Get trending stocks',
    description:
      'Fetches a list of trending stocks based on current market activity.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of trending stocks.',
    schema: {
      example: {
        success: true,
        data: [
          {
            open: 150.0,
            high: 155.0,
            low: 149.0,
            price: 153.0,
            volume: 1000000,
            latestTradingDay: '2024-06-01',
            previousClose: 151.0,
            change: 2.0,
            changePercent: '1.32%',
          },
          {
            open: 150.0,
            high: 155.0,
            low: 149.0,
            price: 153.0,
            volume: 1000000,
            latestTradingDay: '2024-06-01',
            previousClose: 151.0,
            change: 2.0,
            changePercent: '1.32%',
          },
        ],
        timestamp: '2024-06-01T12:00:00.000Z',
      },
    },
  })
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
