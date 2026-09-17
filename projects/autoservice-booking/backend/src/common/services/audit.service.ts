import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}
  record(input: { actorId?: string; action: string; entityType: string; entityId?: string; metadata?: Prisma.InputJsonValue; ipAddress?: string }) {
    return this.prisma.auditLog.create({ data: input });
  }
}
