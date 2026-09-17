import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Locale, OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { AuditService } from '../../common/services/audit.service';
import { calculateCartTotals, calculateLine } from '../cart/pricing';
import { PrismaService } from '../prisma/prisma.service';
import { DemoPaymentService } from './demo-payment.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { canTransitionOrder } from './order-state';

const orderInclude = {
  items: true,
  shippingAddress: true,
  user: { select: { id: true, email: true, firstName: true, lastName: true } },
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payment: DemoPaymentService,
    private readonly audit: AuditService,
  ) {}

  async create(userId: string, dto: CreateOrderDto, locale: Locale) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: { include: { translations: true } } } } },
    });
    if (!cart?.items.length) throw new BadRequestException('Cart is empty');

    const priced = cart.items.map((item) => ({
      price: Number(item.product.price),
      discountPercent: item.product.discountPercent,
      quantity: item.quantity,
    }));
    const totals = calculateCartTotals(priced);
    const shipping = totals.total >= 100 ? 0 : 8.9;
    const grandTotal = Math.round((totals.total + shipping) * 100) / 100;
    const payment = this.payment.authorize(dto.paymentMethod, grandTotal);
    if (!payment.approved) throw new BadRequestException('Demo payment was declined');

    return this.prisma.$transaction(async (tx) => {
      for (const item of cart.items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, isActive: true, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity }, popularity: { increment: item.quantity } },
        });
        if (!updated.count) throw new ConflictException(`Insufficient stock for ${item.product.sku}`);
      }

      const address = await tx.address.create({
        data: { userId, ...dto.shippingAddress, country: dto.shippingAddress.country.toUpperCase() },
      });
      const order = await tx.order.create({
        data: {
          number: this.orderNumber(),
          userId,
          shippingAddressId: address.id,
          status: OrderStatus.CONFIRMED,
          paymentStatus: payment.pending ? PaymentStatus.PENDING : PaymentStatus.PAID,
          paymentReference: payment.reference,
          subtotal: totals.subtotal,
          discount: totals.discount,
          shipping,
          total: grandTotal,
          items: {
            create: cart.items.map((item, index) => {
              const translation =
                item.product.translations.find((entry) => entry.locale === locale) ??
                item.product.translations.find((entry) => entry.locale === Locale.EN);
              return {
                productId: item.productId,
                sku: item.product.sku,
                name: translation?.name ?? item.product.sku,
                unitPrice: Number(item.product.price),
                discountPercent: item.product.discountPercent,
                quantity: item.quantity,
                lineTotal: calculateLine(priced[index]).total,
              };
            }),
          },
        },
        include: orderInclude,
      });
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return order;
    });
  }

  mine(userId: string) {
    return this.prisma.order.findMany({ where: { userId }, include: orderInclude, orderBy: { createdAt: 'desc' } });
  }

  async one(userId: string, id: string, isAdmin = false) {
    const order = await this.prisma.order.findFirst({
      where: { id, ...(isAdmin ? {} : { userId }) },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  all(page = 1, limit = 30, status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: status ? { status } : {},
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, actorId: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (!canTransitionOrder(order.status, dto.status)) {
      throw new BadRequestException(`Cannot change order from ${order.status} to ${dto.status}`);
    }
    const updated = await this.prisma.order.update({ where: { id }, data: { status: dto.status }, include: orderInclude });
    await this.audit.record({
      actorId,
      action: 'ORDER_STATUS_CHANGED',
      entityType: 'Order',
      entityId: id,
      metadata: { from: order.status, to: dto.status },
    });
    return updated;
  }

  private orderNumber() {
    const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `APS-${stamp}-${suffix}`;
  }
}
