import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AssignPrinterDto } from './dto/assign-printer.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Roles(Role.BUYER)
  @Post()
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.userId, dto);
  }

  @Roles(Role.BUYER)
  @Get()
  listMine(@Req() req: any) {
    return this.ordersService.listForBuyer(req.user.userId);
  }

  @Roles(Role.BUYER)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.findOne(id, req.user.userId);
  }

  @Roles(Role.BUYER)
  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.cancel(id, req.user.userId);
  }

  @Roles(Role.BUYER)
  @Post(':id/assign-printer')
  assignPrinter(@Param('id') id: string, @Req() req: any, @Body() dto: AssignPrinterDto) {
    return this.ordersService.assignPrinter(id, req.user.userId, dto.printerId);
  }

  @Roles(Role.BUYER)
  @Post(':id/confirm-delivery')
  confirmDelivery(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.confirmDelivery(id, req.user.userId);
  }
}