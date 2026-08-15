import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay;

  constructor(private prisma: PrismaService) {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID ?? '',
      key_secret: process.env.RAZORPAY_KEY_SECRET ?? '',
    });
  }

  async createPayment(buyerId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.buyerId !== buyerId) {
      throw new NotFoundException('Order not found');
    }
    if (!order.estimatedCost) {
      throw new BadRequestException('Order has no cost to charge');
    }

    const existing = await this.prisma.payment.findUnique({ where: { orderId } });
    if (existing) {
      throw new BadRequestException('Payment already initiated for this order');
    }

    const amountInPaise = Math.round(Number(order.estimatedCost) * 100);
    const platformFee = Number(order.estimatedCost) * 0.15;
    const designerPayout = Number(order.estimatedCost) * 0.7;
    const printerPayout = Number(order.estimatedCost) * 0.15;

    const razorpayOrder = await this.razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: orderId,
    });

    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        stripePaymentIntentId: razorpayOrder.id,
        amount: order.estimatedCost,
        platformFee,
        designerPayout,
        printerPayout,
        status: PaymentStatus.REQUIRES_PAYMENT,
      },
    });

    return {
      paymentId: payment.id,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  }

  async verifyPayment(params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const body = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET ?? '')
      .update(body)
      .digest('hex');

    if (expectedSignature !== params.razorpaySignature) {
      throw new BadRequestException('Payment signature verification failed');
    }

    const payment = await this.prisma.payment.findFirst({
      where: { stripePaymentIntentId: params.razorpayOrderId },
    });
    if (!payment) throw new NotFoundException('Payment record not found');

    return this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.PAID },
    });
  }
}