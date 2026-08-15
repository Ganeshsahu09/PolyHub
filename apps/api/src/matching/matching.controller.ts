import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { MatchingService } from './matching.service';

@Controller('matching')
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(
    private matchingService: MatchingService,
    private prisma: PrismaService,
  ) {}

  // Given an order, finds candidate printers. For now this defaults to
  // PLA since models don't have a material field yet (that arrives with
  // ModelVariant selection) — good enough to prove the matching logic
  // end-to-end; we'll wire in the real per-order material next.
  @Get('orders/:orderId/candidates')
  async findForOrder(@Param('orderId') orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { model: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const shippingAddress = order.shippingAddress as any;
    const buyerLat = shippingAddress?.latitude;
    const buyerLng = shippingAddress?.longitude;

    return this.matchingService.findCandidates({
      material: 'PLA',
      buyerLat,
      buyerLng,
      maxDistanceKm: 50,
    });
  }
}