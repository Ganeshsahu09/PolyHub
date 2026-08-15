import { IsString } from 'class-validator';

export class DeleteModelDto {
  @IsString()
  password!: string;
}