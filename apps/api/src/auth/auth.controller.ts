import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsString } from 'class-validator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

class RefreshDto {
  @IsString()
  refreshToken!: string;
}

class VerifyPasswordDto {
  @IsString()
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Tighter than the global 100/min default — login/register are the
  // classic brute-force/credential-stuffing targets, so they get their
  // own stricter limit regardless of what the rest of the API allows.
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-password')
  async verifyPassword(@Req() req: any, @Body() dto: VerifyPasswordDto) {
    const valid = await this.authService.verifyPassword(req.user.userId, dto.password);
    return { valid };
  }
}