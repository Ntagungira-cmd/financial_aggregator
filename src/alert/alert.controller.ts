import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AlertService } from './alert.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { AlertEntity } from './alert.entity';
import { JwtAuthGuard } from '..//common/guards/jwt-auth.guard';

@Controller('alert')
@UseGuards(JwtAuthGuard)
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createAlert(
    @Body() createAlertDto: CreateAlertDto,
    @Request() req: any,
  ): Promise<AlertEntity> {
    const userId = req.user.id;
    return this.alertService.createAlert(
      userId,
      createAlertDto.type,
      createAlertDto.target,
      createAlertDto.condition,
      createAlertDto.value,
      createAlertDto.notificationEmail,
    );
  }

  @Get()
  async getUserAlerts(@Request() req: any): Promise<AlertEntity[]> {
    const userId = req.user.id;
    return this.alertService.getUserAlerts(userId);
  }

  @Get(':id')
  async getAlert(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<AlertEntity> {
    const userId = req.user.id;
    return this.alertService.getAlertById(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAlert(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<void> {
    const userId = req.user.id;
    return this.alertService.deleteAlert(id, userId);
  }

  @Post(':id/toggle')
  async toggleAlert(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<AlertEntity> {
    const userId = req.user.id;
    return this.alertService.toggleAlert(id, userId);
  }
}
