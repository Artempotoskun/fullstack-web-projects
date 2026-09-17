import { Locale } from '@prisma/client';
import { CatalogService } from '../src/modules/catalog/catalog.service';
import { ProductSort } from '../src/modules/catalog/dto/catalog.dto';

describe('CatalogService filters', () => {
  it('builds a parameterized Prisma query for search and fitment', async () => {
    const prisma: any = {
      product: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
      $transaction: jest.fn((promises: Promise<unknown>[]) => Promise.all(promises)),
    };
    const service = new CatalogService(prisma);
    await service.findProducts({ search: 'bosch', engineId: 'engine-1', year: 2019, sort: ProductSort.PRICE_ASC, page: 1, limit: 12, locale: Locale.EN });
    expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        isActive: true,
        compatibility: { some: { engineId: 'engine-1', fromYear: { lte: 2019 }, toYear: { gte: 2019 } } },
        OR: expect.any(Array),
      }),
      orderBy: { price: 'asc' },
      take: 12,
    }));
  });
});
