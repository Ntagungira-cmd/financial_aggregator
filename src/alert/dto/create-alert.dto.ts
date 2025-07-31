import {
  IsEnum,
  IsString,
  IsNumber,
  IsEmail,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { AlertType } from '../../common/enums/alert-type.enum';
import { AlertCondition } from '../../common/enums/alert-condition.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAlertDto {
  @ApiProperty({ example: AlertType.STOCK, enum: AlertType })
  @IsEnum(AlertType)
  @IsNotEmpty()
  type: AlertType;

  @ApiProperty({ example: 'AAPL', description: 'The stock or currency symbol to monitor' })
  @IsString()
  @IsNotEmpty()
  target: string;

  @ApiProperty({ example: AlertCondition.ABOVE, enum: AlertCondition })
  @IsEnum(AlertCondition)
  @IsNotEmpty()
  condition: AlertCondition;

  @ApiProperty({ example: 150.0 })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  notificationEmail: string;
}
