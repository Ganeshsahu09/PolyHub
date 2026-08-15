import { IsArray, IsEnum, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { LicenseType } from '@prisma/client';

// All fields optional — a PATCH only needs to send what's changing.
export class UpdateModelDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  priceBase?: number;

  @IsOptional()
  @IsEnum(LicenseType)
  licenseType?: LicenseType;
}