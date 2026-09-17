import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AddCompatibilityDto, CreateVehicleEngineDto, CreateVehicleMakeDto, CreateVehicleModelDto, UpdateVehicleEngineDto, UpdateVehicleMakeDto, UpdateVehicleModelDto } from './dto/vehicle.dto';
import { VehiclesService } from './vehicles.service';

@ApiTags('vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  @Public()
  @Get()
  tree() {
    return this.vehicles.tree();
  }

  @ApiBearerAuth() @Roles(Role.ADMIN) @Post('makes')
  createMake(@Body() dto: CreateVehicleMakeDto) { return this.vehicles.createMake(dto); }

  @ApiBearerAuth() @Roles(Role.ADMIN) @Post('models')
  createModel(@Body() dto: CreateVehicleModelDto) { return this.vehicles.createModel(dto); }

  @ApiBearerAuth() @Roles(Role.ADMIN) @Post('engines')
  createEngine(@Body() dto: CreateVehicleEngineDto) { return this.vehicles.createEngine(dto); }

  @ApiBearerAuth() @Roles(Role.ADMIN) @Post('compatibility')
  addCompatibility(@Body() dto: AddCompatibilityDto) { return this.vehicles.addCompatibility(dto); }

  @ApiBearerAuth() @Roles(Role.ADMIN) @Delete('compatibility/:productId/:engineId')
  removeCompatibility(
    @Param('productId') productId: string,
    @Param('engineId') engineId: string,
    @Query('fromYear') fromYear: number,
    @Query('toYear') toYear: number,
  ) {
    return this.vehicles.removeCompatibility(productId, engineId, Number(fromYear), Number(toYear));
  }

  @ApiBearerAuth() @Roles(Role.ADMIN) @Patch('makes/:id')
  updateMake(@Param('id') id: string, @Body() dto: UpdateVehicleMakeDto) { return this.vehicles.updateMake(id, dto); }
  @ApiBearerAuth() @Roles(Role.ADMIN) @Patch('models/:id')
  updateModel(@Param('id') id: string, @Body() dto: UpdateVehicleModelDto) { return this.vehicles.updateModel(id, dto); }
  @ApiBearerAuth() @Roles(Role.ADMIN) @Patch('engines/:id')
  updateEngine(@Param('id') id: string, @Body() dto: UpdateVehicleEngineDto) { return this.vehicles.updateEngine(id, dto); }
  @ApiBearerAuth() @Roles(Role.ADMIN) @Delete('makes/:id')
  deleteMake(@Param('id') id: string) { return this.vehicles.deleteMake(id); }
  @ApiBearerAuth() @Roles(Role.ADMIN) @Delete('models/:id')
  deleteModel(@Param('id') id: string) { return this.vehicles.deleteModel(id); }
  @ApiBearerAuth() @Roles(Role.ADMIN) @Delete('engines/:id')
  deleteEngine(@Param('id') id: string) { return this.vehicles.deleteEngine(id); }
}
