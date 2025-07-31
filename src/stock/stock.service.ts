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

    const apiKey = this.configService.get('ALPHA_VANTAGE_API_KEY');
    if (!apiKey) {
      throw new Error('Alpha Vantage API key not configured');
    }

    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;

    try {
      this.logger.log(`Fetching stock quote for ${symbol}`);
      const response = await firstValueFrom(this.httpService.get(url));
      const quote = response.data['Global Quote'];

      if (!quote || Object.keys(quote).length === 0) {
        throw new Error(`No data found for symbol: ${symbol}`);
      }

      // Handle API rate limit response
      if (
        response.data.Note &&
        response.data.Note.includes('API call frequency')
      ) {
        throw new Error('API rate limit exceeded. Please try again later.');
      }

      const processedData: StockQuoteResponse = {
        symbol: quote['01. symbol'],
        open: parseFloat(quote['02. open']) || 0,
        high: parseFloat(quote['03. high']) || 0,
        low: parseFloat(quote['04. low']) || 0,
        price: parseFloat(quote['05. price']) || 0,
        volume: parseInt(quote['06. volume']) || 0,
        latestTradingDay: quote['07. latest trading day'] || '',
        previousClose: parseFloat(quote['08. previous close']) || 0,
        change: parseFloat(quote['09. change']) || 0,
        changePercent: quote['10. change percent'] || '0%',
      };

      // Cache for 5 minutes
      await this.cacheManager.set(cacheKey, processedData, 300);

      // Save to database asynchronously
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

      if (error.message.includes('rate limit')) {
        throw error;
      }

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
    const indices = ['^GSPC', '^DJI', '^IXIC']; // S&P 500, Dow Jones, NASDAQ

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

  async searchStocks(query: string): Promise<any> {
    const cacheKey = `stock_search_${query}`;
    const cached = await this.cacheManager.get(cacheKey);

    if (cached) {
      return cached;
    }

    const apiKey = this.configService.get('ALPHA_VANTAGE_API_KEY');
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${query}&apikey=${apiKey}`;

    try {
      const response = await firstValueFrom(this.httpService.get(url));
      const matches = response.data.bestMatches || [];

      const processedMatches = matches.slice(0, 10).map((match: any) => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        type: match['3. type'],
        region: match['4. region'],
        marketOpen: match['5. marketOpen'],
        marketClose: match['6. marketClose'],
        timezone: match['7. timezone'],
        currency: match['8. currency'],
        matchScore: match['9. matchScore'],
      }));

      await this.cacheManager.set(cacheKey, processedMatches, 1800); // Cache for 30 minutes
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
