import { IsString, IsNumber, IsOptional, IsUrl, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCharityRecordDto {
  @IsString()
  period: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  revenueTotal: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  percentageAllocated: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amountSent: number;

  @IsOptional()
  @IsUrl()
  externalProofUrl?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
