import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { AdminService } from './admin.service';
import { CreateBayDto, CreateBlockedPeriodDto, CreateMechanicDto, CreateServiceDto, UpdateBusinessHoursDto, UpdateServiceDto } from './dto/admin.dto';

@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}
  @Get('dashboard') dashboard() { return this.admin.dashboard(); }
  @Get('resources') resources() { return this.admin.resources(); }
  @Get('audit') audit() { return this.admin.auditLogs(); }
  @Post('services') createService(@CurrentUser() user: AuthUser, @Body() dto: CreateServiceDto) { return this.admin.createService(user.id, dto); }
  @Patch('services/:id') updateService(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateServiceDto) { return this.admin.updateService(user.id, id, dto); }
  @Patch('locations/:id/business-hours') hours(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateBusinessHoursDto) { return this.admin.updateHours(user.id, id, dto); }
  @Post('blocked-periods') block(@CurrentUser() user: AuthUser, @Body() dto: CreateBlockedPeriodDto) { return this.admin.block(user.id, dto); }
  @Post('mechanics') mechanic(@CurrentUser() user: AuthUser, @Body() dto: CreateMechanicDto) { return this.admin.createMechanic(user.id, dto); }
  @Post('service-bays') bay(@CurrentUser() user: AuthUser, @Body() dto: CreateBayDto) { return this.admin.createBay(user.id, dto); }
}
