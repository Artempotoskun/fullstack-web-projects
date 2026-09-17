import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddCompatibilityDto, CreateVehicleEngineDto, CreateVehicleMakeDto, CreateVehicleModelDto, UpdateVehicleEngineDto, UpdateVehicleMakeDto, UpdateVehicleModelDto } from './dto/vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  tree() {
    return this.prisma.vehicleMake.findMany({
      include: { models: { include: { engines: true }, orderBy: { name: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  createMake(dto: CreateVehicleMakeDto) {
    return this.prisma.vehicleMake.create({ data: dto });
  }

  createModel(dto: CreateVehicleModelDto) {
    return this.prisma.vehicleModel.create({ data: dto });
  }

  createEngine(dto: CreateVehicleEngineDto) {
    return this.prisma.vehicleEngine.create({ data: dto });
  }

  addCompatibility(dto: AddCompatibilityDto) {
    return this.prisma.productCompatibility.create({ data: dto });
  }

  removeCompatibility(productId: string, engineId: string, fromYear: number, toYear: number) {
    return this.prisma.productCompatibility.delete({
      where: { productId_engineId_fromYear_toYear: { productId, engineId, fromYear, toYear } },
    });
  }

  updateMake(id: string, dto: UpdateVehicleMakeDto) { return this.prisma.vehicleMake.update({ where: { id }, data: dto }); }
  updateModel(id: string, dto: UpdateVehicleModelDto) { return this.prisma.vehicleModel.update({ where: { id }, data: dto }); }
  updateEngine(id: string, dto: UpdateVehicleEngineDto) { return this.prisma.vehicleEngine.update({ where: { id }, data: dto }); }
  deleteMake(id: string) { return this.prisma.vehicleMake.delete({ where: { id } }); }
  deleteModel(id: string) { return this.prisma.vehicleModel.delete({ where: { id } }); }
  deleteEngine(id: string) { return this.prisma.vehicleEngine.delete({ where: { id } }); }
}
