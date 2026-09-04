import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
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

  /**
   * Handles Razorpay webhook events — the safety net for the case the
   * client-side /verify call never fires (buyer closes the tab mid-payment,
   * network drops right after paying, etc). Razorpay retries webhooks with
   * backoff if we don't return 2xx, and may send the same event more than
   * once even on success — so every code path here has to be idempotent:
   * safe to run twice on the same payment without corrupting anything.
   */
  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';
    if (!webhookSecret) {
      // Fail loudly in logs rather than silently accepting unverifiable
      // webhooks — a missing secret means signature checks below would
      // be comparing against garbage, which is worse than refusing.
      this.logger.error('RAZORPAY_WEBHOOK_SECRET is not set — rejecting webhook');
      throw new BadRequestException('Webhook not configured');
    }

    const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

    // Timing-safe comparison — a plain !== leaks timing information that
    // could theoretically help an attacker forge a valid signature byte
    // by byte. Buffers must be equal length or timingSafeEqual throws,
    // so guard that first.
    const sigBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const signatureValid =
      sigBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(sigBuffer, expectedBuffer);

    if (!signatureValid) {
      this.logger.warn('Webhook signature verification failed');
      throw new BadRequestException('Invalid webhook signature');
    }

    let event: any;
    try {
      event = JSON.parse(rawBody.toString('utf8'));
    } catch {
      throw new BadRequestException('Invalid webhook payload');
    }

    const eventType = event?.event;
    this.logger.log(`Received verified webhook: ${eventType}`);

    if (eventType === 'payment.captured') {
      await this.markPaymentFromWebhook(event, PaymentStatus.PAID);
    } else if (eventType === 'payment.failed') {
      await this.markPaymentFromWebhook(event, PaymentStatus.FAILED);
    } else {
      // Any other event type (order.paid, refund.processed, etc.) — log
      // and acknowledge rather than error, so Razorpay doesn't retry an
      // event we're intentionally not handling yet.
      this.logger.log(`Ignoring unhandled webhook event type: ${eventType}`);
    }

    return { received: true };
  }

  private async markPaymentFromWebhook(event: any, targetStatus: PaymentStatus) {
    const razorpayOrderId = event?.payload?.payment?.entity?.order_id;
    if (!razorpayOrderId) {
      this.logger.warn(`Webhook event missing payment.entity.order_id, event: ${event?.event}`);
      return;
    }

    const payment = await this.prisma.payment.findFirst({
      where: { stripePaymentIntentId: razorpayOrderId },
    });

    if (!payment) {
      // Not necessarily a bug — could be a webhook for an order created
      // in a different environment (e.g. Razorpay test events hitting a
      // shared webhook URL). Log and move on rather than erroring.
      this.logger.warn(`No payment found for razorpay order ${razorpayOrderId} (event: ${event?.event})`);
      return;
    }

    if (payment.status === targetStatus) {
      // Already in the target state — most likely the buyer's own
      // /verify call already handled this, or Razorpay retried an
      // already-processed webhook. Nothing to do; this is the normal,
      // expected case, not an error.
      this.logger.log(`Payment ${payment.id} already ${targetStatus}, skipping (idempotent no-op)`);
      return;
    }

    // Once a payment is PAID, a later webhook should never downgrade it
    // (e.g. a stale/out-of-order failed event arriving after a captured
    // one) — PAID is treated as terminal-success here.
    if (payment.status === PaymentStatus.PAID) {
      this.logger.warn(
        `Ignoring ${targetStatus} webhook for payment ${payment.id} — already marked PAID, not downgrading`,
      );
      return;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: targetStatus },
    });
    this.logger.log(`Payment ${payment.id} updated to ${targetStatus} via webhook`);
  }
}