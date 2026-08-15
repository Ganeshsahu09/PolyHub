import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityType, LicenseGrantStatus, ModelStatus } from '@prisma/client';

@Injectable()
export class SocialService {
  constructor(private prisma: PrismaService) {}

  async follow(followerId: string, designerId: string) {
    if (followerId === designerId) {
      throw new BadRequestException('Cannot follow yourself');
    }
    const designer = await this.prisma.designerProfile.findUnique({ where: { userId: designerId } });
    if (!designer) throw new NotFoundException('Designer not found');

    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId: designerId } },
    });
    if (existing) return existing;

    const follow = await this.prisma.follow.create({
      data: { followerId, followingId: designerId },
    });

    await this.prisma.activity.create({
      data: { actorId: followerId, type: ActivityType.FOLLOW, modelId: null },
    });

    return follow;
  }

  async unfollow(followerId: string, designerId: string) {
    await this.prisma.follow.deleteMany({
      where: { followerId, followingId: designerId },
    });
    return { unfollowed: true };
  }

  async listFollowers(designerId: string) {
    const follows = await this.prisma.follow.findMany({
      where: { followingId: designerId },
      include: { follower: { select: { id: true, name: true, email: true } } },
    });
    return follows.map((f) => f.follower);
  }

  async listFollowing(userId: string) {
    const follows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      include: { following: { select: { id: true, name: true, email: true } } },
    });
    return follows.map((f) => f.following);
  }

  async toggleStar(userId: string, modelId: string) {
    const model = await this.prisma.model3D.findUnique({ where: { id: modelId } });
    if (!model) throw new NotFoundException('Model not found');

    const existing = await this.prisma.star.findUnique({
      where: { userId_modelId: { userId, modelId } },
    });

    if (existing) {
      await this.prisma.star.delete({ where: { id: existing.id } });
      return { starred: false };
    }

    await this.prisma.star.create({ data: { userId, modelId } });
    await this.prisma.activity.create({
      data: { actorId: userId, type: ActivityType.MODEL_STARRED, modelId },
    });
    return { starred: true };
  }

  async listMyStars(userId: string) {
    const stars = await this.prisma.star.findMany({
      where: { userId },
      include: { model: true },
      orderBy: { createdAt: 'desc' },
    });
    return stars.map((s) => s.model);
  }

  async getPublicProfile(designerId: string) {
    const designer = await this.prisma.designerProfile.findUnique({
      where: { userId: designerId },
      include: {
        user: { select: { id: true, name: true, createdAt: true } },
        models: { where: { status: ModelStatus.LIVE }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!designer) throw new NotFoundException('Designer not found');

    const followerCount = await this.prisma.follow.count({ where: { followingId: designerId } });

    return {
      user: designer.user,
      bio: designer.bio,
      portfolioUrl: designer.portfolioUrl,
      followerCount,
      models: designer.models,
    };
  }

  async requestLicense(requesterId: string, modelId: string, message?: string) {
    const model = await this.prisma.model3D.findUnique({ where: { id: modelId } });
    if (!model) throw new NotFoundException('Model not found');
    if (model.designerId === requesterId) {
      throw new BadRequestException('Cannot request a license for your own model');
    }

    const existing = await this.prisma.licenseGrant.findUnique({
      where: { modelId_requesterId: { modelId, requesterId } },
    });
    if (existing) {
      throw new BadRequestException('You already have a license request for this model');
    }

    return this.prisma.licenseGrant.create({
      data: { modelId, requesterId, message },
    });
  }

  async respondToLicense(designerId: string, grantId: string, action: 'approve' | 'decline' | 'revoke') {
    const grant = await this.prisma.licenseGrant.findUnique({
      where: { id: grantId },
      include: { model: true },
    });
    if (!grant) throw new NotFoundException('License request not found');
    if (grant.model.designerId !== designerId) {
      throw new ForbiddenException('Not the owner of this model');
    }

    const statusMap = {
      approve: LicenseGrantStatus.APPROVED,
      decline: LicenseGrantStatus.DECLINED,
      revoke: LicenseGrantStatus.REVOKED,
    };

    return this.prisma.licenseGrant.update({
      where: { id: grantId },
      data: { status: statusMap[action], respondedAt: new Date() },
    });
  }

  async listIncomingLicenseRequests(designerId: string) {
    return this.prisma.licenseGrant.findMany({
      where: { model: { designerId } },
      include: { model: true, requester: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listMyLicenseRequests(requesterId: string) {
    return this.prisma.licenseGrant.findMany({
      where: { requesterId },
      include: { model: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFeed(userId: string) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);
    if (followingIds.length === 0) return [];

    return this.prisma.activity.findMany({
      where: { actorId: { in: followingIds } },
      include: {
        actor: { select: { id: true, name: true } },
        model: { select: { id: true, title: true, thumbnailKey: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // Browse/discover: lists all designers with at least one live model,
  // so buyers/designers can find people to follow.
  async listDesigners() {
    const designers = await this.prisma.designerProfile.findMany({
      include: {
        user: { select: { id: true, name: true, createdAt: true } },
        models: { where: { status: ModelStatus.LIVE }, select: { id: true } },
      },
    });

    const withCounts = await Promise.all(
      designers.map(async (d) => ({
        user: d.user,
        bio: d.bio,
        liveModelCount: d.models.length,
        followerCount: await this.prisma.follow.count({ where: { followingId: d.userId } }),
      })),
    );

    return withCounts.filter((d) => d.liveModelCount > 0);
  }
}