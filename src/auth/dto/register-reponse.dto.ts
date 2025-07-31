import { IsEmail, IsString, IsUUID } from 'class-validator';
import { AlertEntity } from '../../alert/alert.entity';
import { BudgetEntity } from '../../budget/budget.entity';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponse {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Name of the user',
    example: 'John Doe',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Creation date of the user',
    example: '2023-01-01T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date of the user',
    example: '2023-01-01T00:00:00Z',
  })
  @IsString()
  updatedAt: Date;

  @ApiProperty({
    description: 'List of alerts for the user',
    type: [AlertEntity],
  })
  alerts: AlertEntity[];

  @ApiProperty({
    description: 'List of budgets for the user',
    type: [BudgetEntity],
  })
  budgets: BudgetEntity[];
}
