import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEvent {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  record(event: AuditEvent) {
    return this.prisma.auditLog.create({ data: event });
  }

  list(userId: string, take = 50) {
    return this.prisma.auditLog.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: Math.min(take, 100) });
  }
}
