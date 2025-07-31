import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertEntity } from './alert.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StockService } from '../stock/stock.service';
import { CurrencyService } from '../currency/currency.service';
import { MailerService } from '@nestjs-modules/mailer';
import { AlertType } from '../common/enums/alert-type.enum';
import { AlertCondition } from '../common/enums/alert-condition.enum';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(
    @InjectRepository(AlertEntity)
    private alertRepository: Repository<AlertEntity>,
    private stockService: StockService,
    private currencyService: CurrencyService,
    private mailerService: MailerService,
  ) {}

  async createAlert(
    userId: string,
    type: AlertType,
    target: string,
    condition: AlertCondition,
    value: number,
    notificationEmail: string,
  ): Promise<AlertEntity> {
    const alert = this.alertRepository.create({
      userId,
      type,
      target: target.toUpperCase(), // Normalize stock symbols and currency pairs
      condition,
      value,
      notificationEmail,
      isActive: true,
    });

    return this.alertRepository.save(alert);
  }

  async getAlertById(id: string, userId: string): Promise<AlertEntity> {
    const alert = await this.alertRepository.findOne({
      where: { id, userId },
    });

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }

    return alert;
  }

  async deleteAlert(id: string, userId: string): Promise<void> {
    const alert = await this.getAlertById(id, userId);
    await this.alertRepository.remove(alert);
  }

  async toggleAlert(id: string, userId: string): Promise<AlertEntity> {
    const alert = await this.getAlertById(id, userId);
    alert.isActive = !alert.isActive;
    return this.alertRepository.save(alert);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkAlerts() {
    this.logger.log('Checking active alerts...');

    const activeAlerts = await this.alertRepository.find({
      where: { isActive: true },
    });

    this.logger.log(`Found ${activeAlerts.length} active alerts to check`);

    for (const alert of activeAlerts) {
      try {
        let currentValue: number;

        if (alert.type === AlertType.STOCK) {
          const quote = await this.stockService.getStockQuote(alert.target);
          currentValue = quote.price;
        } else if (alert.type === AlertType.CURRENCY) {
          const rates = await this.currencyService.getLatestRates(alert.target);
          currentValue = rates['USD'];
        } else {
          this.logger.warn(`Unknown alert type: ${alert.type}`);
          continue;
        }

        const shouldTrigger =
          (alert.condition === AlertCondition.ABOVE &&
            currentValue > alert.value) ||
          (alert.condition === AlertCondition.BELOW &&
            currentValue < alert.value);

        if (shouldTrigger) {
          await this.triggerAlert(alert, currentValue);
          alert.isActive = false;
          alert.triggeredAt = new Date();
          alert.triggeredValue = currentValue;
          await this.alertRepository.save(alert);
          this.logger.log(`Alert ${alert.id} triggered and deactivated`);
        }
      } catch (error) {
        this.logger.error(
          `Failed to check alert ${alert.id}: ${error.message}`,
          error.stack,
        );
      }
    }
  }

  private async triggerAlert(alert: AlertEntity, currentValue: number) {
    const subject = `🚨 Alert: ${alert.target} ${alert.condition} ${alert.value}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f44336;">Alert Triggered!</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
          <p><strong>Target:</strong> ${alert.target}</p>
          <p><strong>Condition:</strong> ${alert.condition} ${alert.value}</p>
          <p><strong>Current Value:</strong> ${currentValue}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p style="margin-top: 20px; color: #666;">
          This alert has been automatically deactivated. You can create a new alert if needed.
        </p>
      </div>
    `;

    const text = `Your alert has been triggered:
Target: ${alert.target}
Condition: ${alert.condition} ${alert.value}
Current value: ${currentValue}
Time: ${new Date().toISOString()}

This alert has been automatically deactivated.`;

    try {
      await this.mailerService.sendMail({
        to: alert.notificationEmail,
        subject,
        html,
        text,
      });
      this.logger.log(
        `Alert ${alert.id} triggered and email sent to ${alert.notificationEmail}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email for alert ${alert.id}: ${error.message}`,
        error.stack,
      );
    }
  }

  async getUserAlerts(userId: string): Promise<AlertEntity[]> {
    return this.alertRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getActiveAlertsCount(userId: string): Promise<number> {
    return this.alertRepository.count({
      where: { userId, isActive: true },
    });
  }

  async getTriggeredAlerts(userId: string): Promise<AlertEntity[]> {
    return this.alertRepository.find({
      where: { userId, isActive: false, triggeredAt: { $ne: null } as any },
      order: { triggeredAt: 'DESC' },
    });
  }
}
