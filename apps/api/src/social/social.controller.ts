import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { SocialService } from './social.service';
import { RequestLicenseDto } from './dto/request-license.dto';
import { RespondLicenseDto } from './dto/respond-license.dto';

@Controller()
export class SocialController {
  constructor(private socialService: SocialService) {}

  @Get('designers')
  listDesigners() {
    return this.socialService.listDesigners();
  }

  @Get('designers/:id/profile')
  getProfile(@Param('id') id: string) {
    return this.socialService.getPublicProfile(id);
  }

  @Get('designers/:id/followers')
  listFollowers(@Param('id') id: string) {
    return this.socialService.listFollowers(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('designers/:id/follow')
  follow(@Param('id') id: string, @Req() req: any) {
    return this.socialService.follow(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('designers/:id/follow')
  unfollow(@Param('id') id: string, @Req() req: any) {
    return this.socialService.unfollow(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/following')
  listFollowing(@Req() req: any) {
    return this.socialService.listFollowing(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('models/:id/star')
  toggleStar(@Param('id') id: string, @Req() req: any) {
    return this.socialService.toggleStar(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/stars')
  listMyStars(@Req() req: any) {
    return this.socialService.listMyStars(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DESIGNER)
  @Post('models/:id/request-license')
  requestLicense(@Param('id') id: string, @Req() req: any, @Body() dto: RequestLicenseDto) {
    return this.socialService.requestLicense(req.user.userId, id, dto.message);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DESIGNER)
  @Post('license-grants/:id/respond')
  respondToLicense(@Param('id') id: string, @Req() req: any, @Body() dto: RespondLicenseDto) {
    return this.socialService.respondToLicense(req.user.userId, id, dto.action);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DESIGNER)
  @Get('me/license-requests/incoming')
  incomingRequests(@Req() req: any) {
    return this.socialService.listIncomingLicenseRequests(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DESIGNER)
  @Get('me/license-requests/mine')
  myRequests(@Req() req: any) {
    return this.socialService.listMyLicenseRequests(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/feed')
  getFeed(@Req() req: any) {
    return this.socialService.getFeed(req.user.userId);
  }
}