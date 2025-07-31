import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity()
export class CurrencyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 3 })
  @Index()
  baseCurrency: string; // ISO currency code (e.g., USD)

  @Column({ length: 3 })
  @Index()
  targetCurrency: string; // ISO currency code (e.g., EUR)

  @Column('decimal', { precision: 19, scale: 8 })
  rate: number;

  @CreateDateColumn()
  @Index()
  timestamp: Date;

  @Column({ nullable: true })
  source: string; // API source (e.g., 'fixer', 'exchange-rate-api')
}
