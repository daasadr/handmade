import { IsEnum, IsBoolean, IsOptional } from 'class-validator';
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
}
