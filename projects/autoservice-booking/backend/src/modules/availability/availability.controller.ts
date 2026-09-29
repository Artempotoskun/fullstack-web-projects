import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { AvailabilityCalendarQueryDto, AvailabilityQueryDto } from './dto/availability.dto';
import { AvailabilityService } from './availability.service';

@Public()
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}
  @Get() slots(@Query() query: AvailabilityQueryDto) { return this.availability.getAvailability(query.serviceId, query.locationId, query.date, query.vehicleId); }
  @Get('calendar') calendar(@Query() query: AvailabilityCalendarQueryDto) { return this.availability.calendar(query.serviceId, query.locationId, new Date(query.from), new Date(query.to)); }
}
