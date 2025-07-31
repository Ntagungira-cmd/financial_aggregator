import {
  Controller,
  Get,
  Query,
  Param,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';
import { GetRatesQueryDto } from './dto/get-rates.query.dto';
import { HistoricalRatesQueryDto } from './dto/historical-rates.query.dto';

@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('rates')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getLatestRates(@Query() query: GetRatesQueryDto) {
    try {
      const rates = await this.currencyService.getLatestRates(query.base);
      return {
        success: true,
        data: {
          base: query.base,
          rates,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: error.message || 'Failed to fetch exchange rates',
      });
    }
  }

  @Get('rates/:base/:target/history')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getHistoricalRates(
    @Param('base') base: string,
    @Param('target') target: string,
    @Query() query: HistoricalRatesQueryDto,
  ) {
    // Validate currency codes
    if (!this.isValidCurrencyCode(base) || !this.isValidCurrencyCode(target)) {
      throw new BadRequestException({
        success: false,
        message: 'Invalid currency codes. Must be 3-letter ISO codes.',
      });
    }

    const rates = await this.currencyService.getHistoricalRates(
      base.toUpperCase(),
      target.toUpperCase(),
      query.days,
    );

    return {
      success: true,
      data: {
        base: base.toUpperCase(),
        target: target.toUpperCase(),
        days: query.days,
        rates: rates.map((rate) => ({
          rate: rate.rate,
          timestamp: rate.timestamp,
          source: rate.source,
        })),
      },
    };
  }

  @Post('convert')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async convertCurrency(@Body() convertDto: ConvertCurrencyDto) {
    if (convertDto.from === convertDto.to) {
      throw new BadRequestException({
        success: false,
        message: 'From and to currencies cannot be the same',
      });
    }

    try {
      const convertedAmount = await this.currencyService.convertAmount(
        convertDto.from,
        convertDto.to,
        convertDto.amount,
      );

      const rate = convertedAmount / convertDto.amount;

      return {
        success: true,
        data: {
          from: convertDto.from,
          to: convertDto.to,
          originalAmount: convertDto.amount,
          convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimal places
          rate: Math.round(rate * 100000) / 100000, // Round to 5 decimal places
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: error.message || 'Conversion failed',
      });
    }
  }

  @Get('supported')
  async getSupportedCurrencies() {
    const currencies = await this.currencyService.getSupportedCurrencies();
    return {
      success: true,
      data: {
        currencies,
        count: currencies.length,
      },
    };
  }

  @Get('rates/:base/:target/latest')
  async getSpecificRate(
    @Param('base') base: string,
    @Param('target') target: string,
  ) {
    if (!this.isValidCurrencyCode(base) || !this.isValidCurrencyCode(target)) {
      throw new BadRequestException({
        success: false,
        message: 'Invalid currency codes. Must be 3-letter ISO codes.',
      });
    }

    if (base.toUpperCase() === target.toUpperCase()) {
      return {
        success: true,
        data: {
          base: base.toUpperCase(),
          target: target.toUpperCase(),
          rate: 1,
          timestamp: new Date().toISOString(),
        },
      };
    }

    try {
      const rate = await this.currencyService.getSpecificRate(
        base.toUpperCase(),
        target.toUpperCase(),
      );

      return {
        success: true,
        data: {
          base: base.toUpperCase(),
          target: target.toUpperCase(),
          rate,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: error.message || 'Failed to fetch exchange rate',
      });
    }
  }

  private isValidCurrencyCode(code: string): boolean {
    return (
      typeof code === 'string' &&
      code.length === 3 &&
      /^[A-Z]{3}$/.test(code.toUpperCase())
    );
  }
}
