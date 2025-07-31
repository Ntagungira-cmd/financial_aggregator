import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockPriceEntity } from './stock.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { StockQuoteResponse } from '../common/interfaces/stock-quote-response';

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(
    @InjectRepository(StockPriceEntity)
    private stockRepository: Repository<StockPriceEntity>,
    private httpService: HttpService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getStockQuote(symbol: string): Promise<StockQuoteResponse> {
    const cacheKey = `stock_quote_${symbol}`;
    const cached = await this.cacheManager.get<StockQuoteResponse>(cacheKey);

    if (cached) {
      this.logger.log(`Returning cached data for ${symbol}`);
      return cached;
    }

    const apiKey = this.configService.get('MARKETSTACK_API_KEY');
    if (!apiKey) {
      throw new Error('Marketstack API key not configured');
    }

    const url = `http://api.marketstack.com/v1/eod/latest?access_key=${apiKey}&symbols=${symbol}`;

    try {
      this.logger.log(`Fetching stock quote for ${symbol}`);
      const response = await firstValueFrom(this.httpService.get(url));
      const data = response.data;

      // Handle API limit errors
      if (data.error) {
        throw new Error(`Marketstack API error: ${data.error.message}`);
      }

      const quote = data.data?.[0];

      if (!quote) {
        throw new Error(`No data found for symbol: ${symbol}`);
      }

      const processedData: StockQuoteResponse = {
        symbol: quote.symbol,
        open: parseFloat(quote.open) || 0,
        high: parseFloat(quote.high) || 0,
        low: parseFloat(quote.low) || 0,
        price: parseFloat(quote.close) || 0,
        volume: parseInt(quote.volume) || 0,
        latestTradingDay: quote.date || '',
        previousClose: parseFloat(quote.previous_close) || 0,
        change: parseFloat(quote.change) || 0,
        changePercent: quote.change_percent
          ? `${quote.change_percent.toFixed(2)}%`
          : '0%',
      };

      await this.cacheManager.set(cacheKey, processedData, 30000);

      this.saveStockToDB(processedData).catch((error) => {
        this.logger.error(
          `Failed to save stock data to DB for ${symbol}`,
          error.stack,
        );
      });

      return processedData;
    } catch (error) {
      this.logger.error(
        `Failed to fetch stock quote for ${symbol}`,
        error.stack,
      );

      throw new Error(
        `Failed to fetch stock quote for ${symbol}: ${error.message}`,
      );
    }
  }

  private async saveStockToDB(data: StockQuoteResponse): Promise<void> {
    try {
      const entity = new StockPriceEntity();
      entity.symbol = data.symbol;
      entity.price = data.price;
      entity.open = data.open;
      entity.high = data.high;
      entity.low = data.low;
      entity.volume = data.volume;
      entity.change = data.change;
      entity.changePercent =
        parseFloat(data.changePercent.replace('%', '')) || 0;
      entity.latestTradingDay = data.latestTradingDay;
      entity.previousClose = data.previousClose;
      entity.source = 'alpha-vantage';
      entity.timestamp = new Date();

      await this.stockRepository.save(entity);
      this.logger.log(`Saved stock data for ${data.symbol} to database`);
    } catch (error) {
      this.logger.error(`Failed to save stock data to database`, error.stack);
      throw error;
    }
  }

  async getHistoricalData(
    symbol: string,
    days: number,
  ): Promise<StockPriceEntity[]> {
    try {
      const data = await this.stockRepository
        .createQueryBuilder('stock')
        .where('stock.symbol = :symbol', { symbol })
        .orderBy('stock.timestamp', 'DESC')
        .limit(days)
        .getMany();

      this.logger.log(
        `Retrieved ${data.length} historical records for ${symbol}`,
      );
      return data;
    } catch (error) {
      this.logger.error(
        `Failed to get historical data for ${symbol}`,
        error.stack,
      );
      throw new Error(`Failed to retrieve historical data for ${symbol}`);
    }
  }

  async getMarketIndices(): Promise<StockQuoteResponse[]> {
    const indices = ['DIA', 'QQQ', 'SPY']; // Dow Jones, NASDAQ, S&P 500

    try {
      const results = await Promise.allSettled(
        indices.map((index) => this.getStockQuote(index)),
      );

      const successfulResults = results
        .filter((result) => result.status === 'fulfilled')
        .map(
          (result) =>
            (result as PromiseFulfilledResult<StockQuoteResponse>).value,
        );

      if (successfulResults.length === 0) {
        throw new Error('Failed to fetch any market indices');
      }

      // Log any failures
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          this.logger.warn(
            `Failed to fetch ${indices[index]}: ${result.reason}`,
          );
        }
      });

      return successfulResults;
    } catch (error) {
      this.logger.error('Failed to fetch market indices', error.stack);
      throw new Error('Failed to fetch market indices');
    }
  }

  async searchStocks(query: string): Promise<
    Array<{
      symbol: string;
      name: string;
      type: string;
      region: string;
      marketOpen: string;
      marketClose: string;
      timezone: string;
      currency: string;
      matchScore: string;
    }>
  > {
    const cacheKey = `stock_search_${query}`;
    const cached = await this.cacheManager.get<typeof cached>(cacheKey);

    if (cached) {
      return cached;
    }

    const apiKey = this.configService.get('MARKETSTACK_API_KEY');
    const url = `http://api.marketstack.com/v1/tickers?access_key=${apiKey}&search=${query}`;

    try {
      const response = await firstValueFrom(this.httpService.get(url));
      const matches = response.data.data || [];

      const processedMatches = matches.slice(0, 10).map((match: any) => ({
        symbol: match.symbol,
        name: match.name,
        type: match.hasOwnProperty('stock_exchange') ? 'equity' : 'unknown',
        region: match.stock_exchange?.country || 'unknown',
        marketOpen: match.stock_exchange?.acronym ? '09:30' : '',
        marketClose: match.stock_exchange?.acronym ? '16:00' : '',
        timezone: match.stock_exchange?.timezone || '',
        currency: match.currency || 'USD',
        matchScore: '1.0', // Marketstack doesn't return match score, so you could use a default
      }));

      await this.cacheManager.set(cacheKey, processedMatches, 18000); // Cache for 30 mins
      return processedMatches;
    } catch (error) {
      this.logger.error(
        `Failed to search stocks for query: ${query}`,
        error.stack,
      );
      throw new Error(`Failed to search stocks: ${error.message}`);
    }
  }

  async getTrendingStocks(): Promise<StockQuoteResponse[]> {
    const popularSymbols = [
      'AAPL',
      'GOOGL',
      'MSFT',
      'AMZN',
      'TSLA',
      'META',
      'NVDA',
      'NFLX',
    ];

    try {
      const results = await Promise.allSettled(
        popularSymbols.map((symbol) => this.getStockQuote(symbol)),
      );

      return results
        .filter((result) => result.status === 'fulfilled')
        .map(
          (result) =>
            (result as PromiseFulfilledResult<StockQuoteResponse>).value,
        )
        .slice(0, 5); // Return top 5
    } catch (error) {
      this.logger.error('Failed to fetch trending stocks', error.stack);
      throw new Error('Failed to fetch trending stocks');
    }
  }
}
