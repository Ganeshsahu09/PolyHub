import { BadRequestException, Body, Controller, Headers, Post, RawBodyRequest, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUYER)
  @Post('create')
  create(@Req() req: any, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.createPayment(req.user.userId, dto.orderId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUYER)
  @Post('verify')
  verify(@Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment({
      razorpayOrderId: dto.razorpayOrderId,
      razorpayPaymentId: dto.razorpayPaymentId,
      razorpaySignature: dto.razorpaySignature,
    });
  }

  // Deliberately outside the JwtAuthGuard/RolesGuard above — Razorpay
  // calls this directly, with no user session at all. Security here
  // comes entirely from the HMAC signature check in the service, not
  // from auth guards. This is the safety net for a buyer closing the
  // tab mid-payment: Razorpay tells us the real outcome even if the
  // client-side /verify call never happened.
  @Post('webhook')
  webhook(@Req() req: RawBodyRequest<Request>, @Headers('x-razorpay-signature') signature: string) {
    if (!req.rawBody) {
      // Should never happen if main.ts has rawBody: true — fail loudly
      // rather than silently skip signature verification.
      throw new BadRequestException('Raw body not available for signature verification');
    }
    if (!signature) {
      throw new BadRequestException('Missing X-Razorpay-Signature header');
    }
    return this.paymentsService.handleWebhook(req.rawBody, signature);
  }
}