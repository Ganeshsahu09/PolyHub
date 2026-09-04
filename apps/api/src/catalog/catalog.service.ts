import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AuthService } from '../auth/auth.service';
import { MlService } from '../ml/ml.service';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto';
import { ModelStatus } from '@prisma/client';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private authService: AuthService,
    private ml: MlService,
  ) {}

  async getUploadUrl(dto: RequestUploadUrlDto) {
    const key = this.storage.buildKey('models', dto.filename);
    const uploadUrl = await this.storage.getPresignedUploadUrl(key, dto.contentType, dto.fileSize);
    return { uploadUrl, key };
  }

  async createModel(designerId: string, key: string, dto: CreateModelDto) {
    const model = await this.prisma.model3D.create({
      data: {
        designerId,
        title: dto.title,
        description: dto.description,
        tags: dto.tags,
        category: dto.category,
        fileKey: key,
        fileFormat: dto.fileFormat,
        priceBase: dto.priceBase,
        licenseType: dto.licenseType,
        status: ModelStatus.DRAFT,
      },
    });

    // Best-effort: only STL is supported by the ML service's geometry
    // parser today, and this should never block model creation if the ML
    // service is unreachable or the file can't be parsed. A model without
    // geometry just falls back to the heuristic estimator at order time.
    if (dto.fileFormat?.toLowerCase() === 'stl') {
      this.extractAndSaveGeometry(model.id, key).catch((err) =>
        this.logger.warn(`Geometry extraction failed for model ${model.id}: ${err.message}`),
      );
    }

    return model;
  }

  private async extractAndSaveGeometry(modelId: string, key: string) {
    const fileUrl = await this.storage.getPresignedDownloadUrl(key);
    const geometry = await this.ml.extractGeometry(fileUrl, 'stl');
    if (!geometry) return;

    await this.prisma.model3D.update({
      where: { id: modelId },
      data: {
        volumeMm3: geometry.volumeMm3,
        surfaceAreaMm2: geometry.surfaceAreaMm2,
        boundingBoxX: geometry.boundingBoxX,
        boundingBoxY: geometry.boundingBoxY,
        boundingBoxZ: geometry.boundingBoxZ,
      },
    });
  }

  async listLive() {
    return this.prisma.model3D.findMany({
      where: { status: ModelStatus.LIVE },
      include: {
        designer: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listByDesigner(designerId: string) {
    return this.prisma.model3D.findMany({
      where: { designerId, status: { not: ModelStatus.ARCHIVED } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const model = await this.prisma.model3D.findUnique({
      where: { id },
      include: {
        designer: { include: { user: { select: { id: true, name: true } } } },
      },
    });
    if (!model) throw new NotFoundException('Model not found');
    return model;
  }

  async getViewUrl(id: string) {
    const model = await this.findOne(id);
    const url = await this.storage.getPresignedDownloadUrl(model.fileKey);
    return { url };
  }

  async publish(id: string, designerId: string) {
    const model = await this.findOne(id);
    if (model.designerId !== designerId) {
      throw new NotFoundException('Model not found');
    }
    return this.prisma.model3D.update({
      where: { id },
      data: { status: ModelStatus.LIVE },
    });
  }

  // Updates the editable metadata on a model. Owner-only.
  async update(id: string, designerId: string, dto: UpdateModelDto) {
    const model = await this.findOne(id);
    if (model.designerId !== designerId) {
      throw new ForbiddenException('Not the owner of this model');
    }
    return this.prisma.model3D.update({
      where: { id },
      data: dto,
    });
  }

  // Deletes a model after confirming the designer's password. If the
  // model has real order history, we archive it instead of a hard
  // delete — orders must keep a valid reference to what was ordered,
  // and archived models simply stop appearing anywhere public.
  async remove(id: string, designerId: string, password: string) {
    const model = await this.findOne(id);
    if (model.designerId !== designerId) {
      throw new ForbiddenException('Not the owner of this model');
    }

    const passwordValid = await this.authService.verifyPassword(designerId, password);
    if (!passwordValid) {
      throw new BadRequestException('Incorrect password');
    }

    const orderCount = await this.prisma.order.count({ where: { modelId: id } });

    if (orderCount > 0) {
      const archived = await this.prisma.model3D.update({
        where: { id },
        data: { status: ModelStatus.ARCHIVED },
      });
      return { archived: true, model: archived };
    }

    await this.prisma.model3D.delete({ where: { id } });
    return { archived: false, deleted: true };
  }
}