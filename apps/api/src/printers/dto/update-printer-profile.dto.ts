import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePrinterProfileDto {
  @IsOptional()
  @IsString()
  printerModel?: string;

  @IsOptional()
  @IsNumber()
  buildVolumeXMm?: number;

  @IsOptional()
  @IsNumber()
  buildVolumeYMm?: number;

  @IsOptional()
  @IsNumber()
  buildVolumeZMm?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  materialsSupported?: string[];

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  avgTurnaroundDays?: number;
}