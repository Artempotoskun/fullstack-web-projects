import { Injectable, NotFoundException } from '@nestjs/common';
import { Locale } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const localeMap = { en: Locale.EN, uk: Locale.UK, ru: Locale.RU } as const;

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}
  async services(locale = 'en', locationId?: string) {
    const target = localeMap[locale as keyof typeof localeMap] ?? Locale.EN;
    const rows = await this.prisma.service.findMany({
      where: { isActive: true, ...(locationId ? { locations: { some: { locationId, isActive: true } } } : {}) },
      include: { translations: { where: { locale: target } }, locations: { where: { isActive: true }, select: { locationId: true } } },
      orderBy: [{ category: 'asc' }, { price: 'asc' }],
    });
    return rows.map(({ translations, ...service }) => ({ ...service, name: translations[0]?.name ?? service.slug, description: translations[0]?.description ?? '' }));
  }
  locations() {
    return this.prisma.location.findMany({ where: { isActive: true }, include: { businessHours: { orderBy: { weekday: 'asc' } }, serviceBays: { where: { isActive: true }, select: { id: true, name: true, bayType: true } }, _count: { select: { mechanics: true } } }, orderBy: { name: 'asc' } });
  }
  async service(id: string, locale = 'en') {
    const item = (await this.services(locale)).find((service) => service.id === id);
    if (!item) throw new NotFoundException('Service not found'); return item;
  }
}
