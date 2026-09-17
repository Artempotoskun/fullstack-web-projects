import { Injectable, NotFoundException } from '@nestjs/common';
import { Locale, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCategoryDto,
  CreateManufacturerDto,
  CreateProductDto,
  ProductQueryDto,
  ProductSort,
  UpdateCategoryDto,
  UpdateManufacturerDto,
  UpdateProductDto,
} from './dto/catalog.dto';

const productInclude = {
  manufacturer: true,
  category: { include: { translations: true } },
  translations: true,
  compatibility: {
    include: { engine: { include: { model: { include: { make: true } } } } },
  },
} satisfies Prisma.ProductInclude;

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async findProducts(query: ProductQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(query.manufacturer ? { manufacturer: { slug: query.manufacturer } } : {}),
      ...(query.inStock ? { stockQuantity: { gt: 0 } } : {}),
      ...(query.discounted ? { discountPercent: { gt: 0 } } : {}),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? { price: { gte: query.minPrice, lte: query.maxPrice } }
        : {}),
      ...(query.engineId
        ? {
            compatibility: {
              some: {
                engineId: query.engineId,
                ...(query.year ? { fromYear: { lte: query.year }, toYear: { gte: query.year } } : {}),
              },
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { sku: { contains: search, mode: 'insensitive' } },
              { oemNumber: { contains: search, mode: 'insensitive' } },
              { manufacturer: { name: { contains: search, mode: 'insensitive' } } },
              { translations: { some: { name: { contains: search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sort === ProductSort.PRICE_ASC
        ? { price: 'asc' }
        : query.sort === ProductSort.PRICE_DESC
          ? { price: 'desc' }
          : query.sort === ProductSort.NEWEST
            ? { createdAt: 'desc' }
            : query.sort === ProductSort.NAME
              ? { translations: { _count: 'desc' } }
              : { popularity: 'desc' };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: productInclude,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map((item) => this.localizeProduct(item, query.locale)),
      meta: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) },
    };
  }

  async findProduct(id: string, locale: Locale) {
    const product = await this.prisma.product.findFirst({ where: { id, isActive: true }, include: productInclude });
    if (!product) throw new NotFoundException('Product not found');
    await this.prisma.product.update({ where: { id }, data: { popularity: { increment: 1 } } });
    return this.localizeProduct(product, locale);
  }

  async suggestions(search: string, locale: Locale) {
    const query = search.trim();
    if (query.length < 2) return [];
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { sku: { contains: query, mode: 'insensitive' } },
          { oemNumber: { contains: query, mode: 'insensitive' } },
          { manufacturer: { name: { contains: query, mode: 'insensitive' } } },
          { translations: { some: { name: { contains: query, mode: 'insensitive' } } } },
        ],
      },
      include: { translations: true, manufacturer: true },
      take: 8,
      orderBy: { popularity: 'desc' },
    });
    return products.map((product) => ({
      id: product.id,
      sku: product.sku,
      name: this.translation(product.translations, locale)?.name ?? product.sku,
      manufacturer: product.manufacturer.name,
    }));
  }

  async categories(locale: Locale) {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      include: { translations: true, _count: { select: { products: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    return categories.map(({ translations, ...category }) => ({
      ...category,
      name: this.translation(translations, locale)?.name ?? category.slug,
    }));
  }

  manufacturers() {
    return this.prisma.manufacturer.findMany({
      where: { isActive: true },
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createProduct(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        sku: dto.sku,
        oemNumber: dto.oemNumber,
        manufacturerId: dto.manufacturerId,
        categoryId: dto.categoryId,
        price: dto.price,
        discountPercent: dto.discountPercent,
        stockQuantity: dto.stockQuantity,
        images: dto.images,
        specifications: dto.specifications,
        translations: { create: dto.translations },
        compatibility: { create: dto.compatibility ?? [] },
      },
      include: productInclude,
    });
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    await this.ensureProduct(id);
    const { translations, compatibility, specifications, ...data } = dto;
    return this.prisma.$transaction(async (tx) => {
      if (translations) {
        await Promise.all(
          translations.map((item) =>
            tx.productTranslation.upsert({
              where: { productId_locale: { productId: id, locale: item.locale } },
              create: { productId: id, ...item },
              update: { name: item.name, description: item.description },
            }),
          ),
        );
      }
      if (compatibility) {
        await tx.productCompatibility.deleteMany({ where: { productId: id } });
        await tx.productCompatibility.createMany({
          data: compatibility.map((item) => ({ productId: id, ...item })),
        });
      }
      return tx.product.update({
        where: { id },
        data: { ...data, ...(specifications ? { specifications } : {}) },
        include: productInclude,
      });
    });
  }

  async deactivateProduct(id: string) {
    await this.ensureProduct(id);
    return this.prisma.product.update({ where: { id }, data: { isActive: false } });
  }

  createCategory(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        slug: dto.slug,
        icon: dto.icon,
        sortOrder: dto.sortOrder,
        translations: {
          create: dto.translations.map(({ locale, name }) => ({ locale, name })),
        },
      },
      include: { translations: true },
    });
  }

  createManufacturer(dto: CreateManufacturerDto) {
    return this.prisma.manufacturer.create({ data: dto });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const { translations, ...data } = dto;
    return this.prisma.$transaction(async (tx) => {
      if (translations) {
        await Promise.all(translations.map((item) => tx.categoryTranslation.upsert({
          where: { categoryId_locale: { categoryId: id, locale: item.locale } },
          create: { categoryId: id, ...item },
          update: { name: item.name },
        })));
      }
      return tx.category.update({ where: { id }, data, include: { translations: true } });
    });
  }

  deactivateCategory(id: string) {
    return this.prisma.category.update({ where: { id }, data: { isActive: false } });
  }

  updateManufacturer(id: string, dto: UpdateManufacturerDto) {
    return this.prisma.manufacturer.update({ where: { id }, data: dto });
  }

  deactivateManufacturer(id: string) {
    return this.prisma.manufacturer.update({ where: { id }, data: { isActive: false } });
  }

  private ensureProduct(id: string) {
    return this.prisma.product.findUniqueOrThrow({ where: { id }, select: { id: true } }).catch(() => {
      throw new NotFoundException('Product not found');
    });
  }

  private translation<T extends { locale: Locale }>(translations: T[], locale: Locale): T | undefined {
    return translations.find((item) => item.locale === locale) ?? translations.find((item) => item.locale === Locale.EN);
  }

  private localizeProduct(product: any, locale: Locale) {
    const translation = this.translation<{ locale: Locale; name: string; description: string }>(product.translations, locale);
    const categoryTranslation = this.translation<{ locale: Locale; name: string }>(product.category.translations, locale);
    return {
      ...product,
      price: Number(product.price),
      name: translation?.name ?? product.sku,
      description: translation?.description ?? '',
      category: { ...product.category, name: categoryTranslation?.name ?? product.category.slug },
      translations: undefined,
      compatibility: product.compatibility.map((item: any) => ({
        id: `${item.engineId}-${item.fromYear}`,
        engineId: item.engineId,
        engine: item.engine.name,
        model: item.engine.model.name,
        make: item.engine.model.make.name,
        fromYear: item.fromYear,
        toYear: item.toYear,
      })),
    };
  }
}
