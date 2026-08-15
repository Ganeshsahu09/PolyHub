import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CatalogService } from './catalog.service';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { DeleteModelDto } from './dto/delete-model.dto';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto';

@Controller('catalog')
export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  @Get('models')
  listLive() {
    return this.catalogService.listLive();
  }

  @Get('models/:id')
  findOne(@Param('id') id: string) {
    return this.catalogService.findOne(id);
  }

  @Get('models/:id/view-url')
  getViewUrl(@Param('id') id: string) {
    return this.catalogService.getViewUrl(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DESIGNER)
  @Post('upload-url')
  getUploadUrl(@Body() dto: RequestUploadUrlDto) {
    return this.catalogService.getUploadUrl(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DESIGNER)
  @Post('models')
  createModel(@Req() req: any, @Body() body: CreateModelDto & { key: string }) {
    const { key, ...dto } = body;
    return this.catalogService.createModel(req.user.userId, key, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DESIGNER)
  @Get('my-models')
  listMine(@Req() req: any) {
    return this.catalogService.listByDesigner(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DESIGNER)
  @Post('models/:id/publish')
  publish(@Param('id') id: string, @Req() req: any) {
    return this.catalogService.publish(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DESIGNER)
  @Patch('models/:id')
  update(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateModelDto) {
    return this.catalogService.update(id, req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DESIGNER)
  @Delete('models/:id')
  remove(@Param('id') id: string, @Req() req: any, @Body() dto: DeleteModelDto) {
    return this.catalogService.remove(id, req.user.userId, dto.password);
  }
}