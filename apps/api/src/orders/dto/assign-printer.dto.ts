import { IsString } from 'class-validator';

export class AssignPrinterDto {
  @IsString()
  printerId!: string;
}