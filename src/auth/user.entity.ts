import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { AlertEntity } from '../alert/alert.entity';
import { BudgetEntity } from '../budget/budget.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ select: false }) // Don't select password by default
  password: string;

  @Column({ length: 255 })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => AlertEntity, (alert) => alert.user)
  alerts: AlertEntity[];

  @OneToMany(() => BudgetEntity, (budget) => budget.user)
  budgets: BudgetEntity[];
}
