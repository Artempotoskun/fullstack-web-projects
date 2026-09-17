import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Locale } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';
import { calculateCartTotals, calculateLine } from './pricing';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string, locale: Locale) {
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: {
        items: {
          include: {
            product: { include: { translations: true, manufacturer: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    const items = cart.items.map((item) => {
      const translation =
        item.product.translations.find((entry) => entry.locale === locale) ??
        item.product.translations.find((entry) => entry.locale === Locale.EN);
      const price = Number(item.product.price);
      return {
        id: item.id,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          sku: item.product.sku,
          name: translation?.name ?? item.product.sku,
          manufacturer: item.product.manufacturer.name,
          price,
          discountPercent: item.product.discountPercent,
          stockQuantity: item.product.stockQuantity,
          image: item.product.images[0] ?? null,
        },
        line: calculateLine({ price, discountPercent: item.product.discountPercent, quantity: item.quantity }),
      };
    });
    return {
      id: cart.id,
      items,
      totals: calculateCartTotals(
        items.map((item) => ({
          price: item.product.price,
          discountPercent: item.product.discountPercent,
          quantity: item.quantity,
        })),
      ),
    };
  }

  async add(userId: string, dto: AddCartItemDto) {
    const product = await this.prisma.product.findFirst({ where: { id: dto.productId, isActive: true } });
    if (!product) throw new NotFoundException('Product not found');
    const cart = await this.prisma.cart.upsert({ where: { userId }, create: { userId }, update: {} });
    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: dto.productId } },
    });
    const quantity = (existing?.quantity ?? 0) + dto.quantity;
    if (quantity > product.stockQuantity) throw new BadRequestException('Requested quantity exceeds available stock');
    return this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: dto.productId } },
      create: { cartId: cart.id, productId: dto.productId, quantity },
      update: { quantity },
    });
  }

  async update(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId } },
      include: { product: true },
    });
    if (!item) throw new NotFoundException('Cart item not found');
    if (dto.quantity > item.product.stockQuantity) throw new BadRequestException('Requested quantity exceeds available stock');
    return this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity: dto.quantity } });
  }

  async remove(userId: string, itemId: string) {
    const result = await this.prisma.cartItem.deleteMany({ where: { id: itemId, cart: { userId } } });
    if (!result.count) throw new NotFoundException('Cart item not found');
    return { success: true };
  }

  async clear(userId: string) {
    await this.prisma.cartItem.deleteMany({ where: { cart: { userId } } });
  }
}
