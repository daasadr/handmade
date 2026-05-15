import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('charity_records')
export class CharityRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  period: string; // e.g. '2026-05'

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  revenueTotal: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  percentageAllocated: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amountSent: number;

  @Column({ nullable: true })
  externalProofUrl: string;

  @Column({ nullable: true, type: 'text' })
  note: string;

  @CreateDateColumn()
  createdAt: Date;
}
