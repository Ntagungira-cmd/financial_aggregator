import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { AlertType } from '../common/enums/alert-type.enum';
import { AlertCondition } from '../common/enums/alert-condition.enum';
import { UserEntity } from '../auth/user.entity';

@Entity('alerts')
@Index(['userId', 'isActive'])
@Index(['isActive'])
export class AlertEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, (user) => user.alerts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ type: 'enum', enum: AlertType })
  type: AlertType;

  @Column({ length: 20 }) // Stock symbols and currency pairs are typically short
  target: string;

  @Column({ type: 'enum', enum: AlertCondition })
  condition: AlertCondition;

  @Column('decimal', { precision: 15, scale: 4 })
  value: number;

  @Column({ length: 255 })
  notificationEmail: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  triggeredAt: Date;

  @Column('decimal', { precision: 15, scale: 4, nullable: true })
  triggeredValue: number;
}
