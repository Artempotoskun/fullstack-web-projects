import { Locale, PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const categories = [
  ['engine', 'Engine', 'Двигун', 'Двигатель', '⚙'],
  ['brakes', 'Brakes', 'Гальма', 'Тормоза', '◉'],
  ['suspension', 'Suspension', 'Підвіска', 'Подвеска', '⌁'],
  ['filters', 'Filters', 'Фільтри', 'Фильтры', '▤'],
  ['electrical', 'Electrical', 'Електрика', 'Электрика', 'ϟ'],
  ['transmission', 'Transmission', 'Трансмісія', 'Трансмиссия', '⌘'],
  ['cooling', 'Cooling', 'Охолодження', 'Охлаждение', '❄'],
  ['exhaust', 'Exhaust', 'Вихлоп', 'Выхлоп', '≈'],
  ['body-parts', 'Body Parts', 'Кузовні деталі', 'Кузовные детали', '◇'],
  ['lighting', 'Lighting', 'Освітлення', 'Освещение', '☼'],
  ['oils-fluids', 'Oils & Fluids', 'Оливи та рідини', 'Масла и жидкости', '◒'],
] as const;

const productsByCategory: Record<string, [string, string, string, string][]> = {
  engine: [
    ['Timing Belt Kit', 'Комплект ГРМ', 'Комплект ГРМ', 'TBK'],
    ['Engine Mount', 'Опора двигуна', 'Опора двигателя', 'EMT'],
    ['Valve Cover Gasket', 'Прокладка клапанної кришки', 'Прокладка клапанной крышки', 'VCG'],
    ['Piston Ring Set', 'Комплект поршневих кілець', 'Комплект поршневых колец', 'PRS'],
  ],
  brakes: [
    ['Ceramic Brake Pads', 'Керамічні гальмівні колодки', 'Керамические тормозные колодки', 'CBP'],
    ['Ventilated Brake Disc', 'Вентильований гальмівний диск', 'Вентилируемый тормозной диск', 'VBD'],
    ['Brake Caliper', 'Гальмівний супорт', 'Тормозной суппорт', 'BCL'],
    ['Brake Hose', 'Гальмівний шланг', 'Тормозной шланг', 'BHS'],
  ],
  suspension: [
    ['Gas Shock Absorber', 'Газовий амортизатор', 'Газовый амортизатор', 'GSA'],
    ['Control Arm', 'Важіль підвіски', 'Рычаг подвески', 'CTA'],
    ['Wheel Bearing Kit', 'Комплект підшипника маточини', 'Комплект ступичного подшипника', 'WBK'],
    ['Stabilizer Link', 'Стійка стабілізатора', 'Стойка стабилизатора', 'STL'],
  ],
  filters: [
    ['Premium Oil Filter', 'Преміальний масляний фільтр', 'Премиальный масляный фильтр', 'POF'],
    ['Activated Carbon Cabin Filter', 'Вугільний салонний фільтр', 'Угольный салонный фильтр', 'CCF'],
    ['High Flow Air Filter', 'Повітряний фільтр високої пропускної здатності', 'Воздушный фильтр высокой пропускной способности', 'HAF'],
    ['Fuel Filter', 'Паливний фільтр', 'Топливный фильтр', 'FLF'],
  ],
  electrical: [
    ['Alternator 120A', 'Генератор 120А', 'Генератор 120А', 'ALT'],
    ['Starter Motor', 'Стартер', 'Стартер', 'STR'],
    ['Crankshaft Sensor', 'Датчик колінвала', 'Датчик коленвала', 'CKS'],
    ['Ignition Coil', 'Котушка запалювання', 'Катушка зажигания', 'IGC'],
  ],
  transmission: [
    ['Clutch Kit', 'Комплект зчеплення', 'Комплект сцепления', 'CLK'],
    ['CV Joint Kit', 'Комплект ШРУС', 'Комплект ШРУС', 'CVJ'],
    ['Gearbox Mount', 'Опора КПП', 'Опора КПП', 'GBM'],
    ['Transmission Filter', 'Фільтр трансмісії', 'Фильтр трансмиссии', 'TRF'],
  ],
  cooling: [
    ['Aluminium Radiator', 'Алюмінієвий радіатор', 'Алюминиевый радиатор', 'RAD'],
    ['Water Pump', 'Водяний насос', 'Водяной насос', 'WPM'],
    ['Thermostat', 'Термостат', 'Термостат', 'TMT'],
    ['Cooling Fan', 'Вентилятор охолодження', 'Вентилятор охлаждения', 'CLF'],
  ],
  exhaust: [
    ['Rear Silencer', 'Задній глушник', 'Задний глушитель', 'RSL'],
    ['Catalytic Converter', 'Каталітичний нейтралізатор', 'Каталитический нейтрализатор', 'CAT'],
    ['Exhaust Manifold Gasket', 'Прокладка випускного колектора', 'Прокладка выпускного коллектора', 'EMG'],
    ['Lambda Sensor', 'Лямбда-зонд', 'Лямбда-зонд', 'LMB'],
  ],
  'body-parts': [
    ['Front Fender', 'Переднє крило', 'Переднее крыло', 'FND'],
    ['Door Mirror', 'Дзеркало дверей', 'Зеркало двери', 'DMR'],
    ['Hood Gas Spring', 'Газовий упор капота', 'Газовый упор капота', 'HGS'],
    ['Bumper Reinforcement', 'Підсилювач бампера', 'Усилитель бампера', 'BPR'],
  ],
  lighting: [
    ['LED Headlight', 'Світлодіодна фара', 'Светодиодная фара', 'LED'],
    ['Tail Light Assembly', 'Задній ліхтар у зборі', 'Задний фонарь в сборе', 'TLA'],
    ['Fog Light', 'Протитуманна фара', 'Противотуманная фара', 'FGL'],
    ['Indicator Lamp', 'Покажчик повороту', 'Указатель поворота', 'IND'],
  ],
  'oils-fluids': [
    ['5W-30 Synthetic Oil 5L', 'Синтетична олива 5W-30 5л', 'Синтетическое масло 5W-30 5л', 'OIL'],
    ['DOT 4 Brake Fluid 1L', 'Гальмівна рідина DOT 4 1л', 'Тормозная жидкость DOT 4 1л', 'BFL'],
    ['G12++ Coolant 5L', 'Антифриз G12++ 5л', 'Антифриз G12++ 5л', 'COL'],
    ['ATF Transmission Fluid 4L', 'Трансмісійна рідина ATF 4л', 'Трансмиссионная жидкость ATF 4л', 'ATF'],
  ],
};

const manufacturers = [
  ['Bosch', 'bosch', 'Germany'],
  ['Brembo', 'brembo', 'Italy'],
  ['Mann-Filter', 'mann-filter', 'Germany'],
  ['Sachs', 'sachs', 'Germany'],
  ['NGK', 'ngk', 'Japan'],
  ['SKF', 'skf', 'Sweden'],
  ['Valeo', 'valeo', 'France'],
  ['Febi Bilstein', 'febi-bilstein', 'Germany'],
] as const;

const vehicles = [
  ['Ford', 'ford', [['Fiesta', 'fiesta', [['1.6 Ti-VCT', 'Petrol', 120]]], ['Focus', 'focus', [['1.5 EcoBoost', 'Petrol', 150]]]]],
  ['Volkswagen', 'volkswagen', [['Golf', 'golf', [['1.4 TSI', 'Petrol', 125]]]]],
  ['Skoda', 'skoda', [['Octavia', 'octavia', [['1.6 TDI', 'Diesel', 115]]]]],
  ['Toyota', 'toyota', [['Corolla', 'corolla', [['1.8 Hybrid', 'Hybrid', 122]]]]],
  ['BMW', 'bmw', [['3 Series', '3-series', [['2.0 320i', 'Petrol', 184]]]]],
] as const;

const imageUrls = [
  'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=82',
];

async function main() {
  const categoryRecords = new Map<string, string>();
  for (const [slug, en, uk, ru, icon] of categories) {
    const category = await prisma.category.upsert({
      where: { slug },
      create: { slug, icon, sortOrder: categoryRecords.size },
      update: { icon, isActive: true, sortOrder: categoryRecords.size },
    });
    categoryRecords.set(slug, category.id);
    for (const [locale, name] of [[Locale.EN, en], [Locale.UK, uk], [Locale.RU, ru]] as const) {
      await prisma.categoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: category.id, locale } },
        create: { categoryId: category.id, locale, name },
        update: { name },
      });
    }
  }

  const manufacturerRecords = [];
  for (const [name, slug, country] of manufacturers) {
    manufacturerRecords.push(await prisma.manufacturer.upsert({
      where: { slug },
      create: { name, slug, country },
      update: { name, country, isActive: true },
    }));
  }

  const engines = [];
  for (const [makeName, makeSlug, models] of vehicles) {
    const make = await prisma.vehicleMake.upsert({
      where: { slug: makeSlug }, create: { name: makeName, slug: makeSlug }, update: { name: makeName },
    });
    for (const [modelName, modelSlug, modelEngines] of models) {
      const model = await prisma.vehicleModel.upsert({
        where: { makeId_slug: { makeId: make.id, slug: modelSlug } },
        create: { makeId: make.id, name: modelName, slug: modelSlug }, update: { name: modelName },
      });
      for (const [name, fuelType, powerHp] of modelEngines) {
        engines.push(await prisma.vehicleEngine.upsert({
          where: { modelId_name: { modelId: model.id, name } },
          create: { modelId: model.id, name, fuelType, powerHp }, update: { fuelType, powerHp },
        }));
      }
    }
  }

  let index = 0;
  for (const [categorySlug] of categories) {
    for (const [en, uk, ru, prefix] of productsByCategory[categorySlug]) {
      index += 1;
      const sku = `${prefix}-${String(1000 + index)}`;
      const manufacturer = manufacturerRecords[index % manufacturerRecords.length];
      const price = Number((18 + index * 7.35).toFixed(2));
      const product = await prisma.product.upsert({
        where: { sku },
        create: {
          sku,
          oemNumber: `OEM-${String(740000 + index)}`,
          categoryId: categoryRecords.get(categorySlug)!,
          manufacturerId: manufacturer.id,
          price,
          discountPercent: index % 5 === 0 ? 15 : index % 7 === 0 ? 10 : 0,
          stockQuantity: index % 9 === 0 ? 3 : 8 + ((index * 7) % 42),
          popularity: 100 - index,
          images: [imageUrls[index % imageUrls.length], imageUrls[(index + 1) % imageUrls.length]],
          specifications: { warranty: '24 months', condition: 'New', quality: 'OE-equivalent' },
        },
        update: {
          price,
          isActive: true,
          images: [imageUrls[index % imageUrls.length], imageUrls[(index + 1) % imageUrls.length]],
        },
      });
      const descriptions = [
        [Locale.EN, en, `Workshop-grade ${en.toLowerCase()} engineered for dependable everyday performance. Verified fitment and a 24-month warranty.`],
        [Locale.UK, uk, `${uk} професійного рівня для надійної щоденної експлуатації. Перевірена сумісність та гарантія 24 місяці.`],
        [Locale.RU, ru, `${ru} профессионального уровня для надёжной ежедневной эксплуатации. Проверенная совместимость и гарантия 24 месяца.`],
      ] as const;
      for (const [locale, name, description] of descriptions) {
        await prisma.productTranslation.upsert({
          where: { productId_locale: { productId: product.id, locale } },
          create: { productId: product.id, locale, name, description }, update: { name, description },
        });
      }
      for (const engine of [engines[index % engines.length], engines[(index + 2) % engines.length]]) {
        await prisma.productCompatibility.upsert({
          where: { productId_engineId_fromYear_toYear: { productId: product.id, engineId: engine.id, fromYear: 2016, toYear: 2024 } },
          create: { productId: product.id, engineId: engine.id, fromYear: 2016, toYear: 2024 }, update: {},
        });
      }
    }
  }

  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'AdminDemo123!';
  const userPassword = process.env.SEED_USER_PASSWORD ?? 'UserDemo123!';
  for (const account of [
    { email: 'admin@autoparts.demo', password: adminPassword, firstName: 'Demo', lastName: 'Admin', role: Role.ADMIN },
    { email: 'user@autoparts.demo', password: userPassword, firstName: 'Demo', lastName: 'Driver', role: Role.USER },
  ]) {
    const user = await prisma.user.upsert({
      where: { email: account.email },
      create: { email: account.email, passwordHash: await hash(account.password, 12), firstName: account.firstName, lastName: account.lastName, role: account.role },
      update: { role: account.role, isActive: true },
    });
    await prisma.cart.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
  }

  console.log(`Seeded ${index} products, ${categories.length} categories and ${engines.length} vehicle engines.`);
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => prisma.$disconnect());
