import { IsIn } from 'class-validator';

export class UpdateJobStatusDto {
  @IsIn(['accept', 'decline', 'start', 'complete', 'fail'])
  action!: 'accept' | 'decline' | 'start' | 'complete' | 'fail';
}