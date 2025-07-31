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

export class CreateAlertDto {
  @IsEnum(AlertType)
  @IsNotEmpty()
  type: AlertType;

  @IsString()
  @IsNotEmpty()
  target: string;

  @IsEnum(AlertCondition)
  @IsNotEmpty()
  condition: AlertCondition;

  @IsNumber()
  @Min(0)
  value: number;

  @IsEmail()
  @IsNotEmpty()
  notificationEmail: string;
}
