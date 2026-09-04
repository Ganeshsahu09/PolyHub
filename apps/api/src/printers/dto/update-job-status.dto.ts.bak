import { IsIn } from 'class-validator';

export class UpdateJobStatusDto {
  @IsIn(['accept', 'start', 'complete', 'fail'])
  action!: 'accept' | 'start' | 'complete' | 'fail';
}