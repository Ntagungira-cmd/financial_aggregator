import {
  Inject,
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrencyEntity } from './currency.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExchangeRateApiResponse } from '../common/interfaces/exchange-rate-api-response';
import { FixerApiResponse } from '../common/interfaces/fixer-api-response';

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly API_TIMEOUT = 10000; // 10 seconds
  private readonly supportedCurrencies = [
    'USD',
    'EUR',
    'GBP',
    'JPY',
    'AUD',
    'CAD',
    'CHF',
    'CNY',
    'SEK',
    'NZD',
    'MXN',
    'SGD',
    'HKD',
    'NOK',
    'TRY',
    'RUB',
    'INR',
    'BRL',
    'ZAR',
    'KRW',
  ];

  constructor(
    @InjectRepository(CurrencyEntity)
    private currencyRepository: Repository<CurrencyEntity>,
    private httpService: HttpService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getLatestRates(base: string = 'USD'): Promise<Record<string, number>> {
    const normalizedBase = base.toUpperCase();
    const cacheKey = `exchange_rates_${normalizedBase}`;

    // Try to get from cache first
    const cached =
      await this.cacheManager.get<Record<string, number>>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for ${normalizedBase} rates`);
      return cached;
    }

    this.logger.log(`Fetching fresh rates for ${normalizedBase}`);

    // Try multiple APIs for redundancy
    const apis = [
      () => this.fetchFromExchangeRateApi(normalizedBase),
      () => this.fetchFromFixerApi(normalizedBase),
    ];

    let rates: Record<string, number> | null = null;
    let lastError: Error | null = null;

    for (const apiCall of apis) {
      try {
        rates = await apiCall();
        if (rates) break;
      } catch (error) {
        lastError = error;
        this.logger.warn(`API call failed: ${error.message}`);
      }
    }

    if (!rates) {
      // Fallback to database if all APIs fail
      rates = await this.getFallbackRatesFromDB(normalizedBase);
      if (!rates) {
        throw new Error(
          `Failed to fetch exchange rates: ${lastError?.message || 'All APIs failed'}`,
        );
      }
    }

    // Cache the results
    await this.cacheManager.set(cacheKey, rates, this.CACHE_TTL);

    // Save to database for future fallback
    await this.saveRatesToDB(normalizedBase, rates);

    return rates;
  }

  private async fetchFromExchangeRateApi(
    base: string,
  ): Promise<Record<string, number>> {
    const apiKey = this.configService.get('EXCHANGE_RATE_API_KEY');
    if (!apiKey) {
      throw new Error('EXCHANGE_RATE_API_KEY not configured');
    }

    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`;

    const response = await firstValueFrom(
      this.httpService.get<ExchangeRateApiResponse>(url).pipe(
        timeout(this.API_TIMEOUT),
        catchError((error) => {
          throw new Error(`ExchangeRate-API error: ${error.message}`);
        }),
      ),
    );

    if (!response.data.conversion_rates) {
      throw new Error('Invalid response from ExchangeRate-API');
    }

    return response.data.conversion_rates;
  }

  private async fetchFromFixerApi(
    base: string,
  ): Promise<Record<string, number>> {
    const apiKey = this.configService.get('FIXER_API_KEY');
    if (!apiKey) {
      throw new Error('FIXER_API_KEY not configured');
    }

    const url = `https://data.fixer.io/api/latest?access_key=${apiKey}&base=${base}`;

    const response = await firstValueFrom(
      this.httpService.get<FixerApiResponse>(url).pipe(
        timeout(this.API_TIMEOUT),
        catchError((error) => {
          throw new Error(`Fixer.io error: ${error.message}`);
        }),
      ),
    );

    if (!response.data.success || !response.data.rates) {
      throw new Error('Invalid response from Fixer.io');
    }

    return response.data.rates;
  }

  private async getFallbackRatesFromDB(
    base: string,
  ): Promise<Record<string, number> | null> {
    this.logger.warn(`Using database fallback for ${base} rates`);

    const latestRates = await this.currencyRepository
      .createQueryBuilder('currency')
      .where('currency.baseCurrency = :base', { base })
      .andWhere('currency.timestamp > :cutoff', {
        cutoff: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      })
      .orderBy('currency.timestamp', 'DESC')
      .getMany();

    if (latestRates.length === 0) {
      return null;
    }

    const rates: Record<string, number> = {};
    latestRates.forEach((rate) => {
      rates[rate.targetCurrency] = rate.rate;
    });

    return rates;
  }

  private async saveRatesToDB(
    base: string,
    rates: Record<string, number>,
    source: string = 'api',
  ): Promise<void> {
    try {
      const entities = Object.entries(rates).map(([currency, rate]) => {
        const entity = new CurrencyEntity();
        entity.baseCurrency = base;
        entity.targetCurrency = currency;
        entity.rate = rate;
        entity.timestamp = new Date();
        entity.source = source;
        return entity;
      });

      await this.currencyRepository.save(entities);
      this.logger.debug(`Saved ${entities.length} rates to database`);
    } catch (error) {
      this.logger.error('Failed to save rates to database', error.stack);
      // Don't throw here as this is a background operation
    }
  }

  async getHistoricalRates(
    base: string,
    target: string,
    days: number = 30,
  ): Promise<CurrencyEntity[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.currencyRepository
      .createQueryBuilder('currency')
      .where('currency.baseCurrency = :base', { base })
      .andWhere('currency.targetCurrency = :target', { target })
      .andWhere('currency.timestamp >= :startDate', { startDate })
      .orderBy('currency.timestamp', 'DESC')
      .getMany();
  }

  async convertAmount(
    from: string,
    to: string,
    amount: number,
  ): Promise<number> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const normalizedFrom = from.toUpperCase();
    const normalizedTo = to.toUpperCase();

    if (normalizedFrom === normalizedTo) {
      return amount;
    }

    const rates = await this.getLatestRates(normalizedFrom);
    const rate = rates[normalizedTo];

    if (!rate) {
      throw new Error(
        `Conversion rate not available for ${normalizedFrom} to ${normalizedTo}`,
      );
    }

    return amount * rate;
  }

  async getSpecificRate(from: string, to: string): Promise<number> {
    const rates = await this.getLatestRates(from);
    const rate = rates[to];

    if (!rate) {
      throw new Error(`Exchange rate not available for ${from} to ${to}`);
    }

    return rate;
  }

  async getSupportedCurrencies(): Promise<string[]> {
    // Try to get from recent rates in database first
    const recentCurrencies = await this.currencyRepository
      .createQueryBuilder('currency')
      .select('DISTINCT currency.targetCurrency', 'currency')
      .where('currency.timestamp > :cutoff', {
        cutoff: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      })
      .getRawMany();

    if (recentCurrencies.length > 0) {
      return recentCurrencies.map((c) => c.currency).sort();
    }

    // Fallback to predefined list
    return this.supportedCurrencies;
  }

  // Scheduled task to update rates every hour
  @Cron(CronExpression.EVERY_HOUR)
  async updateRatesScheduled(): Promise<void> {
    this.logger.log('Running scheduled rate update');

    const baseCurrencies = ['USD', 'EUR', 'GBP', 'JPY'];

    for (const base of baseCurrencies) {
      try {
        await this.getLatestRates(base);
        this.logger.log(`Updated rates for ${base}`);
      } catch (error) {
        this.logger.error(`Failed to update rates for ${base}:`, error.message);
      }
    }
  }

  // Clean up old rates (keep only last 30 days)
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldRates(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    try {
      const result = await this.currencyRepository
        .createQueryBuilder()
        .delete()
        .from(CurrencyEntity)
        .where('timestamp < :cutoff', { cutoff: cutoffDate })
        .execute();

      this.logger.log(`Cleaned up ${result.affected} old currency records`);
    } catch (error) {
      this.logger.error('Failed to cleanup old rates:', error.stack);
    }
  }

  // Health check method
  async healthCheck(): Promise<{
    status: string;
    lastUpdate?: Date;
    cacheStatus: string;
  }> {
    try {
      // Check if we can get rates
      await this.getLatestRates('USD');

      // Check latest database entry
      const latestEntry = await this.currencyRepository
        .createQueryBuilder('currency')
        .orderBy('currency.timestamp', 'DESC')
        .limit(1)
        .getOne();

      return {
        status: 'healthy',
        lastUpdate: latestEntry?.timestamp,
        cacheStatus: 'operational',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        cacheStatus: 'error',
      };
    }
  }
}
