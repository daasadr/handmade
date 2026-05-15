import { IsString, IsUrl, IsOptional } from 'class-validator';

export class CreateAffiliateLinkDto {
  @IsString()
  title: string;

  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  description?: string;
}
