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
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('alerts')
@ApiBearerAuth()
@Controller('alert')
@UseGuards(JwtAuthGuard)
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new alert' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The alert has been successfully created.',
    type: () => AlertEntity,
  })
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
  @ApiOperation({ summary: 'Get all alerts for the authenticated user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all alerts for the user.',
    type: () => [AlertEntity],
  })
  async getUserAlerts(@Request() req: any): Promise<AlertEntity[]> {
    const userId = req.user.id;
    return this.alertService.getUserAlerts(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific alert by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the alert with the specified ID.',
    type: () => AlertEntity,
  })
  async getAlert(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<AlertEntity> {
    const userId = req.user.id;
    return this.alertService.getAlertById(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an alert by ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The alert has been successfully deleted.',
  })
  async deleteAlert(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<void> {
    const userId = req.user.id;
    return this.alertService.deleteAlert(id, userId);
  }

  @Post(':id/toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle the active status of an alert' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The alert has been successfully toggled.',
    type: () => AlertEntity,
  })
  async toggleAlert(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<AlertEntity> {
    const userId = req.user.id;
    return this.alertService.toggleAlert(id, userId);
  }
}
