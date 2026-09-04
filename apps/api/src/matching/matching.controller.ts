import { Controller, ForbiddenException, Get, NotFoundException, Param, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { MatchingService } from './matching.service';

@Controller('matching')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MatchingController {
  constructor(
    private matchingService: MatchingService,
    private prisma: PrismaService,
  ) {}

  // Given an order, finds candidate printers ranked by distance (when the
  // buyer's shipping address has coordinates) and filtered by the material
  // on the order's selected variant, if any.
  @Roles(Role.BUYER)
  @Get('orders/:orderId/candidates')
  async findForOrder(@Req() req: any, @Param('orderId') orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { model: true, variant: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Any authenticated buyer could previously fetch candidates for ANY
    // order id, not just their own — this leaked which printers (with
    // distance) were being considered for someone else's private order.
    if (order.buyerId !== req.user.userId) {
      throw new ForbiddenException('This order does not belong to you');
    }

    const shippingAddress = order.shippingAddress as any;
    const buyerLat = shippingAddress?.latitude;
    const buyerLng = shippingAddress?.longitude;

    return this.matchingService.findCandidates({
      material: order.variant?.material ?? 'PLA',
      buyerLat,
      buyerLng,
      maxDistanceKm: 50,
    });
  }
}