import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModelStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async setModelFlag(modelId: string, action: 'flag' | 'unflag') {
    const model = await this.prisma.model3D.findUnique({ where: { id: modelId } });
    if (!model) throw new NotFoundException('Model not found');

    return this.prisma.model3D.update({
      where: { id: modelId },
      data: { status: action === 'flag' ? ModelStatus.FLAGGED : ModelStatus.LIVE },
    });
  }

  async listDisputedOrders() {
    return this.prisma.order.findMany({
      where: { status: OrderStatus.DISPUTED },
      include: { model: true, buyer: true, printJob: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async listAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        roles: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}