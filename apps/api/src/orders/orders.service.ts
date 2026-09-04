import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MlService } from '../ml/ml.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ModelStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private ml: MlService,
  ) {}

  async create(buyerId: string, dto: CreateOrderDto) {
    const model = await this.prisma.model3D.findUnique({
      where: { id: dto.modelId },
    });
    if (!model || model.status !== ModelStatus.LIVE) {
      throw new NotFoundException('Model not available for order');
    }

    let priceModifier = 0;
    let variantMaterial: string | null = null;
    if (dto.variantId) {
      const variant = await this.prisma.modelVariant.findUnique({
        where: { id: dto.variantId },
      });
      if (!variant || variant.modelId !== dto.modelId) {
        throw new BadRequestException('Invalid variant for this model');
      }
      priceModifier = Number(variant.priceModifier);
      variantMaterial = variant.material;
    }

    const unitPrice = Number(model.priceBase) + priceModifier;
    const estimatedCost = unitPrice * dto.quantity;

    // Best-effort real print-time estimate. Doesn't touch estimatedCost —
    // that stays the designer's sale price, exactly as before. This is a
    // separate, additive prediction of how long the print will actually
    // take, using real geometry when the model has it (STL uploads only
    // for now) and falling back to the ML service's own heuristic
    // otherwise (never blocks order creation if the ML service is down).
    let estimatedPrintTimeMin: number | null = null;
    if (model.volumeMm3) {
      const estimate = await this.ml.estimatePrintJob({
        volumeMm3: model.volumeMm3,
        surfaceAreaMm2: model.surfaceAreaMm2,
        boundingBoxX: model.boundingBoxX,
        boundingBoxY: model.boundingBoxY,
        boundingBoxZ: model.boundingBoxZ,
        material: variantMaterial ?? 'PLA',
      });
      if (estimate) {
        estimatedPrintTimeMin = Math.round(estimate.predictedTimeMin);
      }
    }

    const order = await this.prisma.order.create({
      data: {
        buyerId,
        modelId: dto.modelId,
        variantId: dto.variantId,
        quantity: dto.quantity,
        shippingAddress: dto.shippingAddress,
        estimatedCost,
        estimatedPrintTimeMin,
        status: OrderStatus.PENDING,
      },
    });

    const buyer = await this.prisma.user.findUnique({ where: { id: buyerId } });
    if (buyer) {
      this.notifications.orderPlaced(buyer.email, order.id);
    }

    return order;
  }

  async listForBuyer(buyerId: string) {
    return this.prisma.order.findMany({
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
      include: { model: true, payment: true, printJob: true },
    });
  }

  async findOne(id: string, buyerId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { model: true, payment: true, printJob: true },
    });
    if (!order || order.buyerId !== buyerId) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async cancel(id: string, buyerId: string) {
    const order = await this.findOne(id, buyerId);
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }
    return this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
    });
  }

  async assignPrinter(orderId: string, buyerId: string, printerId: string) {
    const order = await this.findOne(orderId, buyerId);
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order is not awaiting a printer match');
    }

    const printer = await this.prisma.printerProfile.findUnique({
      where: { userId: printerId },
    });
    if (!printer || !printer.isVerified) {
      throw new BadRequestException('Selected printer is not eligible');
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.MATCHED },
    });

    const printJob = await this.prisma.printJob.create({
      data: { orderId, printerId },
    });

    const buyer = await this.prisma.user.findUnique({ where: { id: buyerId } });
    if (buyer) {
      this.notifications.orderMatched(buyer.email, orderId);
    }

    return printJob;
  }

  async confirmDelivery(orderId: string, buyerId: string) {
    const order = await this.findOne(orderId, buyerId);
    if (order.status !== OrderStatus.SHIPPED) {
      throw new BadRequestException('Order must be shipped before it can be marked delivered');
    }
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.DELIVERED },
    });
  }
}