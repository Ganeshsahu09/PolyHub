import { IsIn } from 'class-validator';

export class FlagModelDto {
  @IsIn(['flag', 'unflag'])
  action!: 'flag' | 'unflag';
}