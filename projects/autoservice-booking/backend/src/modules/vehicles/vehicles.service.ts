import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}
  list(userId: string) { return this.prisma.vehicle.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }); }
  create(userId: string, dto: CreateVehicleDto) { return this.prisma.vehicle.create({ data: { userId, ...dto } }); }
  async update(userId: string, id: string, dto: UpdateVehicleDto) {
    await this.assertOwner(userId, id); return this.prisma.vehicle.update({ where: { id }, data: dto });
  }
  async remove(userId: string, id: string) {
    await this.assertOwner(userId, id);
    const active = await this.prisma.booking.count({ where: { vehicleId: id, status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] } } });
    if (active) throw new ForbiddenException('Vehicle has an active booking');
    await this.prisma.vehicle.delete({ where: { id } }); return { success: true };
  }
  async assertOwner(userId: string, id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id }, select: { userId: true } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (vehicle.userId !== userId) throw new ForbiddenException('Vehicle does not belong to this user');
  }
}
