import { ArrayNotEmpty, IsArray, IsEmail, IsEnum, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

// Buyers/Designers/Printer Owners can self-register with any of these
// roles. ADMIN is deliberately excluded — that role can only be granted
// by an existing admin editing the database directly (or, later, an
// admin-only "promote user" endpoint), never via public signup.
const SELF_REGISTERABLE_ROLES = [Role.BUYER, Role.DESIGNER, Role.PRINTER_OWNER];

export class RegisterDto {
  @IsEmail()
  email!: string;

  @MinLength(8)
  password!: string;

  @MinLength(2)
  name!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(SELF_REGISTERABLE_ROLES, { each: true })
  roles!: Role[];
}