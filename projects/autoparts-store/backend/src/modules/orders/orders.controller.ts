import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Locale, OrderStatus, Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto, @Query('locale') locale: Locale = Locale.EN) {
    return this.orders.create(user.id, dto, locale);
  }

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) { return this.orders.mine(user.id); }

  @Get(':id')
  one(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.orders.one(user.id, id, user.role === Role.ADMIN);
  }

  @Roles(Role.ADMIN)
  @Get()
  all(@Query('page') page = 1, @Query('limit') limit = 30, @Query('status') status?: OrderStatus) {
    return this.orders.all(Number(page), Math.min(Number(limit), 100), status);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/status')
  status(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orders.updateStatus(id, dto, user.id);
  }
}
