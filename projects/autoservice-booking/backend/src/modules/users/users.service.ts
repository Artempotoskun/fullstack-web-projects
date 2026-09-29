import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

const safeUser = { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, locale: true, createdAt: true, updatedAt: true } as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  me(id: string) { return this.prisma.user.findUniqueOrThrow({ where: { id }, select: safeUser }); }
  update(id: string, dto: UpdateProfileDto) { return this.prisma.user.update({ where: { id }, data: dto, select: safeUser }); }
  list() { return this.prisma.user.findMany({ select: { ...safeUser, vehicles: true, _count: { select: { vehicles: true, bookings: true } } }, orderBy: { createdAt: 'desc' } }); }
}
