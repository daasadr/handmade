import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { MakerProfile } from '../makers/maker-profile.entity';

export enum UserRole {
  ADMIN = 'admin',
  MAKER = 'maker',
}

export enum UserPlan {
  FREE = 'free',
  MINI = 'mini',
  MIDI = 'midi',
  MAX = 'max',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.MAKER })
  role: UserRole;

  @Column({ type: 'enum', enum: UserPlan, default: UserPlan.FREE })
  plan: UserPlan;

  @Column({ default: false })
  isFoundingMember: boolean;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  emailVerificationToken?: string;

  @Column({ nullable: true })
  passwordResetToken?: string;

  @Column({ nullable: true, type: 'timestamptz' })
  passwordResetExpires?: Date;

  // Měsíční kvóta AI optimalizací
  @Column({ default: 0 })
  aiUsageThisMonth: number;

  @Column({ nullable: true, type: 'timestamptz' })
  aiUsageResetAt: Date;

  @OneToOne(() => MakerProfile, (profile) => profile.user)
  makerProfile: MakerProfile;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
