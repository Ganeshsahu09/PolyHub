import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(reviewerId: string, dto: CreateReviewDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { printJob: true },
    });
    if (!order || order.buyerId !== reviewerId) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Can only review delivered orders');
    }

    const existing = await this.prisma.review.findUnique({ where: { orderId: dto.orderId } });
    if (existing) {
      throw new BadRequestException('This order has already been reviewed');
    }

    const review = await this.prisma.review.create({
      data: {
        orderId: dto.orderId,
        reviewerId,
        targetType: dto.targetType,
        rating: dto.rating,
        comment: dto.comment,
        modelId: dto.targetType === 'model' ? order.modelId : undefined,
      },
    });

    // Keep the printer's aggregate rating up to date. A simple running
    // average — fine at this scale; worth moving to a scheduled
    // recompute job once review volume is high enough for it to matter.
    if (dto.targetType === 'printer' && order.printJob) {
      const printerId = order.printJob.printerId;
      const allPrinterReviews = await this.prisma.review.findMany({
        where: {
          targetType: 'printer',
          order: { printJob: { printerId } },
        },
      });
      const avg =
        allPrinterReviews.reduce((sum, r) => sum + r.rating, 0) / allPrinterReviews.length;
      await this.prisma.printerProfile.update({
        where: { userId: printerId },
        data: { rating: avg },
      });
    }

    return review;
  }

  async listForModel(modelId: string) {
    return this.prisma.review.findMany({
      where: { modelId, targetType: 'model' },
      orderBy: { createdAt: 'desc' },
    });
  }
}