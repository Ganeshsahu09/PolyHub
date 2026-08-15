import { IsOptional, IsString } from 'class-validator';

export class RequestLicenseDto {
  @IsOptional()
  @IsString()
  message?: string;
}