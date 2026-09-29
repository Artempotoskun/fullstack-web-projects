import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { BookingStatus, Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user';
import { BookingsService } from './bookings.service';
import { AdminCreateBookingDto, AssignBookingDto, CancelBookingDto, ChangeBookingStatusDto, CreateBookingDto, RescheduleBookingDto } from './dto/booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}
  @Post() create(@CurrentUser() user: AuthUser, @Body() dto: CreateBookingDto) { return this.bookings.create(user.id, dto); }
  @Get('mine') mine(@CurrentUser() user: AuthUser) { return this.bookings.listMine(user.id); }
  @Get(':id') one(@CurrentUser() user: AuthUser, @Param('id') id: string) { return this.bookings.getOne(id, user); }
  @Patch(':id/reschedule') reschedule(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: RescheduleBookingDto) { return this.bookings.reschedule(id, user.id, user.role, dto); }
  @Patch(':id/cancel') cancel(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: CancelBookingDto) { return this.bookings.cancel(id, user, dto); }

  @Roles(Role.ADMIN) @Get()
  adminList(@Query('from') from?: string, @Query('to') to?: string, @Query('locationId') locationId?: string, @Query('mechanicId') mechanicId?: string, @Query('serviceId') serviceId?: string, @Query('status') status?: BookingStatus) {
    return this.bookings.listAdmin({ from, to, locationId, mechanicId, serviceId, status });
  }
  @Roles(Role.ADMIN) @Post('admin')
  adminCreate(@CurrentUser() admin: AuthUser, @Body() dto: AdminCreateBookingDto) {
    const { userId, ...booking } = dto; return this.bookings.create(userId, booking, admin.id);
  }
  @Roles(Role.ADMIN) @Patch(':id/status')
  status(@CurrentUser() admin: AuthUser, @Param('id') id: string, @Body() dto: ChangeBookingStatusDto) { return this.bookings.changeStatus(id, admin.id, dto); }
  @Roles(Role.ADMIN) @Patch(':id/assignment')
  assign(@CurrentUser() admin: AuthUser, @Param('id') id: string, @Body() dto: AssignBookingDto) { return this.bookings.assign(id, admin.id, dto); }
}
