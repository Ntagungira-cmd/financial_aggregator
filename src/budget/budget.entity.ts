// src/budget/entities/budget.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../auth/user.entity';
import { BudgetCategory } from '../common/enums/budget-category.enum';

@Entity('budget')
export class BudgetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, (user) => user.budgets)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column()
  name: string;

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @Column({ length: 3 })
  currency: string; // ISO currency code (USD, EUR, etc.)

  @Column({ type: 'enum', enum: BudgetCategory, array: true, default: [] })
  categories: BudgetCategory[];

  @Column({ default: 'monthly' })
  period: string; // 'weekly', 'monthly', 'yearly'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;
}
