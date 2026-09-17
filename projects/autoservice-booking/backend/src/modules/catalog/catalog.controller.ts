import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CatalogService } from './catalog.service';

@Public()
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}
  @Get('services') services(@Query('locale') locale?: string, @Query('locationId') locationId?: string) { return this.catalog.services(locale, locationId); }
  @Get('services/:id') service(@Param('id') id: string, @Query('locale') locale?: string) { return this.catalog.service(id, locale); }
  @Get('locations') locations() { return this.catalog.locations(); }
}
