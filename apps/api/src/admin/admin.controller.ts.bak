import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { FlagModelDto } from './dto/flag-model.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Patch('models/:id/flag')
  setModelFlag(@Param('id') id: string, @Body() dto: FlagModelDto) {
    return this.adminService.setModelFlag(id, dto.action);
  }

  @Get('orders/disputed')
  listDisputed() {
    return this.adminService.listDisputedOrders();
  }

  @Get('users')
  listUsers() {
    return this.adminService.listAllUsers();
  }
}