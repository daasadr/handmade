import { IsEnum, IsBoolean, IsOptional, IsDateString } from 'class-validator';
import { UserRole, UserPlan } from '../../users/user.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserPlan)
  plan?: UserPlan;

  @IsOptional()
  @IsBoolean()
  isFoundingMember?: boolean;

  /** VIP = neomezené optimalizace zdarma (testovací účty, výhry v soutěži). */
  @IsOptional()
  @IsBoolean()
  isVip?: boolean;

  /** ISO datum expirace VIP. `null` = neomezeně. */
  @IsOptional()
  @IsDateString()
  vipUntil?: string | null;
}
