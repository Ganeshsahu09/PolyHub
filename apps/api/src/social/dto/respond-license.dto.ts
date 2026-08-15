import { IsIn } from 'class-validator';

export class RespondLicenseDto {
  @IsIn(['approve', 'decline', 'revoke'])
  action!: 'approve' | 'decline' | 'revoke';
}