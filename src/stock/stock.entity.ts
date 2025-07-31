import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity()
export class StockPriceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  symbol: string; // Stock symbol (e.g., AAPL)

  @Column('decimal', { precision: 15, scale: 4 })
  price: number;

  @Column('decimal', { precision: 15, scale: 4 })
  open: number;

  @Column('decimal', { precision: 15, scale: 4 })
  high: number;

  @Column('decimal', { precision: 15, scale: 4 })
  low: number;

  @Column('bigint')
  volume: number;

  @Column('decimal', { precision: 10, scale: 4 })
  change: number;

  @Column('decimal', { precision: 10, scale: 4 })
  changePercent: number;

  @CreateDateColumn()
  @Index()
  timestamp: Date;

  @Column({ nullable: true })
  companyName: string;

  @Column({ nullable: true })
  source: string; // API source (e.g., 'alpha-vantage')

  @Column({ nullable: true })
  latestTradingDay: string;

  @Column('decimal', { precision: 15, scale: 4, nullable: true })
  previousClose: number;
}
