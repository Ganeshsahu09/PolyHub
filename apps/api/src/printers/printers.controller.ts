import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PrintersService } from './printers.service';
import { UpdatePrinterProfileDto } from './dto/update-printer-profile.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';

@Controller('printers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PRINTER_OWNER)
export class PrintersController {
  constructor(private printersService: PrintersService) {}

  @Get('me')
  getMyProfile(@Req() req: any) {
    return this.printersService.getMyProfile(req.user.userId);
  }

  @Patch('me')
  updateMyProfile(@Req() req: any, @Body() dto: UpdatePrinterProfileDto) {
    return this.printersService.updateMyProfile(req.user.userId, dto);
  }

  @Get('me/jobs')
  listMyJobs(@Req() req: any) {
    return this.printersService.listMyJobs(req.user.userId);
  }

  @Post('me/jobs/:jobId/status')
  updateJobStatus(
    @Param('jobId') jobId: string,
    @Req() req: any,
    @Body() dto: UpdateJobStatusDto,
  ) {
    return this.printersService.updateJobStatus(jobId, req.user.userId, dto.action);
  }
}