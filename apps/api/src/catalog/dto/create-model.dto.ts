import { IsArray, IsEnum, IsIn, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { LicenseType } from '@prisma/client';

export class CreateModelDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @IsString()
  category!: string;

  @IsNumber()
  priceBase!: number;

  @IsOptional()
  @IsEnum(LicenseType)
  licenseType?: LicenseType;

  @IsIn(['glb', 'stl', 'obj'])
  fileFormat!: string;

  @IsString()
  originalFilename!: string;
}