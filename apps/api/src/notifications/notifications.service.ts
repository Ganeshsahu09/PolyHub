import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class NotificationsService {
  private resend: Resend;
  private logger = new Logger(NotificationsService.name);

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY ?? '');
  }

  // Fire-and-forget by design: a notification failing should never
  // break the actual business operation (order creation, job status
  // update, etc.) that triggered it. We log failures instead of throwing.
  async send(params: { to: string; subject: string; html: string }) {
    try {
      await this.resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
    } catch (err) {
      this.logger.error(`Failed to send email to ${params.to}: ${err}`);
    }
  }

  async orderPlaced(buyerEmail: string, orderId: string) {
    return this.send({
      to: buyerEmail,
      subject: 'Your PolyHub order has been placed',
      html: `<p>Your order <strong>${orderId}</strong> has been placed and is awaiting a printer match.</p>`,
    });
  }

  async orderMatched(buyerEmail: string, orderId: string) {
    return this.send({
      to: buyerEmail,
      subject: 'A printer has been matched to your order',
      html: `<p>Good news — a printer has accepted your order <strong>${orderId}</strong>.</p>`,
    });
  }

  async orderShipped(buyerEmail: string, orderId: string) {
    return this.send({
      to: buyerEmail,
      subject: 'Your PolyHub order has shipped',
      html: `<p>Your order <strong>${orderId}</strong> has been completed and shipped.</p>`,
    });
  }
}