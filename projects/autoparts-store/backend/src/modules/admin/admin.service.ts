import { Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const [totalUsers, totalProducts, totalOrders, revenue, recentOrders, lowStock] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        where: { paymentStatus: PaymentStatus.PAID, status: { not: OrderStatus.CANCELLED } },
        _sum: { total: true },
      }),
      this.prisma.order.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, firstName: true, lastName: true } }, _count: { select: { items: true } } },
      }),
      this.prisma.product.findMany({
        where: { isActive: true, stockQuantity: { lte: 5 } },
        take: 10,
        orderBy: { stockQuantity: 'asc' },
        include: { translations: { where: { locale: 'EN' } }, manufacturer: true },
      }),
    ]);
    return {
      metrics: { totalUsers, totalProducts, totalOrders, revenue: Number(revenue._sum.total ?? 0) },
      recentOrders,
      lowStock: lowStock.map((product) => ({
        id: product.id,
        sku: product.sku,
        name: product.translations[0]?.name ?? product.sku,
        manufacturer: product.manufacturer.name,
        stockQuantity: product.stockQuantity,
      })),
    };
  }

  audit(page = 1) {
    return this.prisma.auditLog.findMany({
      include: { actor: { select: { email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * 50,
      take: 50,
    });
  }
}
