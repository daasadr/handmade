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

  @Column({ nullable: true })
  passwordHash: string;

  @Column({ nullable: true, unique: true })
  googleId?: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.MAKER })
  role: UserRole;

  @Column({ type: 'enum', enum: UserPlan, default: UserPlan.FREE })
  plan: UserPlan;

  @Column({ default: false })
  isFoundingMember: boolean;

  /**
   * VIP účet — neomezené optimalizace bez placení (interní testovací účty,
   * výhry v soutěži). Záměrně NENÍ řešeno přes `plan = max`: Stripe webhook
   * `customer.subscription.deleted` přepisuje `plan` na `free`, takže by VIP
   * status kdykoliv zmizel. Navíc by komplimentární účty splynuly s platícími
   * zákazníky ve statistikách.
   */
  @Column({ default: false })
  isVip: boolean;

  /** Do kdy VIP platí. `null` = neomezeně (interní účty). */
  @Column({ nullable: true, type: 'timestamptz' })
  vipUntil?: Date;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  emailVerificationToken?: string;

  @Column({ nullable: true })
  passwordResetToken?: string;

  @Column({ nullable: true, type: 'timestamptz' })
  passwordResetExpires?: Date;

  @Column({ nullable: true })
  stripeCustomerId?: string;

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

/** VIP je aktivní, jen pokud příznak platí a případná expirace ještě neuplynula. */
export function isVipActive(user: Pick<User, 'isVip' | 'vipUntil'>): boolean {
  if (!user.isVip) return false;
  if (!user.vipUntil) return true;
  return new Date(user.vipUntil).getTime() > Date.now();
}
