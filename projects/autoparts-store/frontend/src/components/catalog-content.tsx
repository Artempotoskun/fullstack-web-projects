'use client';

import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import type { Category, Manufacturer, ProductList } from '@/lib/types';
import { ProductCard } from './product-card';
import { useI18n } from './providers/i18n-provider';

export function CatalogContent() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const [data, setData] = useState<ProductList | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [mobileFilters, setMobileFilters] = useState(false);
  const queryString = params.toString();

  useEffect(() => {
    const apiLocale = locale.toUpperCase();
    void Promise.all([
      api<ProductList>(`/products?locale=${apiLocale}&${queryString}`),
      api<Category[]>(`/categories?locale=${apiLocale}`),
      api<Manufacturer[]>('/manufacturers'),
    ]).then(([products, cats, makers]) => { setData(products); setCategories(cats); setManufacturers(makers); }).catch(() => setData({ items: [], meta: { page: 1, limit: 12, total: 0, pages: 0 } }));
  }, [locale, queryString]);

  const update = useCallback((key: string, value?: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    router.push(`/${locale}/catalog?${next.toString()}`);
  }, [params, router, locale]);

  const title = params.get('search') ? `“${params.get('search')}”` : t('catalog.title');
  const hasFilters = useMemo(() => ['category', 'manufacturer', 'inStock', 'discounted', 'minPrice', 'maxPrice', 'engineId'].some((key) => params.has(key)), [params]);

  return (
    <div className="container-page py-12">
      <div className="mb-12 flex flex-col gap-6 border-b border-ink/10 pb-10 md:flex-row md:items-end md:justify-between">
        <div><p className="eyebrow">Workshop inventory</p><h1 className="mt-3 font-display text-5xl font-bold tracking-tight sm:text-6xl">{title}</h1><p className="mt-3 max-w-xl text-steel">{t('catalog.text')}</p></div>
        <div className="flex items-center gap-3"><button onClick={() => setMobileFilters(true)} className="btn-outline lg:hidden"><SlidersHorizontal size={17}/>{t('catalog.filters')}</button><select value={params.get('sort') ?? 'popularity'} onChange={(e) => update('sort', e.target.value)} className="field min-w-52 py-3 font-bold"><option value="popularity">{t('catalog.popularity')}</option><option value="newest">{t('catalog.newest')}</option><option value="price_asc">{t('catalog.priceAsc')}</option><option value="price_desc">{t('catalog.priceDesc')}</option></select></div>
      </div>
      <div className="grid gap-10 lg:grid-cols-[250px_1fr]">
        <aside className={`${mobileFilters ? 'fixed inset-0 z-[70] block overflow-auto bg-white p-6' : 'hidden'} lg:static lg:block lg:bg-transparent lg:p-0`}>
          <div className="mb-8 flex items-center justify-between"><h2 className="font-display text-xl font-bold">{t('catalog.filters')}</h2><button onClick={() => setMobileFilters(false)} className="lg:hidden"><X/></button>{hasFilters && <button onClick={() => router.push(`/${locale}/catalog`)} className="hidden text-xs font-bold text-orange lg:block">Clear</button>}</div>
          <FilterGroup title={t('catalog.category')}>{categories.map((item) => <FilterRadio key={item.id} active={params.get('category') === item.slug} label={`${item.name} (${item._count.products})`} onClick={() => update('category', params.get('category') === item.slug ? undefined : item.slug)}/>)}</FilterGroup>
          <FilterGroup title={t('catalog.manufacturer')}>{manufacturers.map((item) => <FilterRadio key={item.id} active={params.get('manufacturer') === item.slug} label={item.name} onClick={() => update('manufacturer', params.get('manufacturer') === item.slug ? undefined : item.slug)}/>)}</FilterGroup>
          <FilterGroup title={t('catalog.price')}><div className="flex gap-2"><input aria-label="Minimum price" type="number" className="field px-3 py-2 text-sm" placeholder="0" defaultValue={params.get('minPrice') ?? ''} onBlur={(e) => update('minPrice', e.target.value)}/><input aria-label="Maximum price" type="number" className="field px-3 py-2 text-sm" placeholder="500" defaultValue={params.get('maxPrice') ?? ''} onBlur={(e) => update('maxPrice', e.target.value)}/></div></FilterGroup>
          <label className="mb-3 flex cursor-pointer items-center gap-3 text-sm font-bold"><input type="checkbox" checked={params.get('inStock') === 'true'} onChange={(e) => update('inStock', e.target.checked ? 'true' : undefined)} className="size-4 accent-orange"/>{t('catalog.available')}</label>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-bold"><input type="checkbox" checked={params.get('discounted') === 'true'} onChange={(e) => update('discounted', e.target.checked ? 'true' : undefined)} className="size-4 accent-orange"/>{t('catalog.discount')}</label>
          <button onClick={() => setMobileFilters(false)} className="btn-primary mt-8 w-full lg:hidden">Show results</button>
        </aside>
        <div>
          <p className="mb-5 text-sm text-steel"><b className="text-ink">{data?.meta.total ?? 0}</b> {t('catalog.results')}</p>
          {!data ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({length:6}, (_,i) => <div key={i} className="h-[430px] animate-pulse rounded-[1.75rem] bg-ink/5"/>)}</div> : data.items.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{data.items.map((product) => <ProductCard key={product.id} product={product}/>)}</div> : <div className="panel grid min-h-80 place-items-center p-8 text-center"><p className="text-xl font-bold text-steel">{t('catalog.noResults')}</p></div>}
          {data && data.meta.pages > 1 && <div className="mt-10 flex items-center justify-center gap-2"><button disabled={data.meta.page <= 1} onClick={() => update('page', String(data.meta.page - 1))} className="grid size-11 place-items-center rounded-full border border-ink/15 disabled:opacity-30"><ChevronLeft/></button>{Array.from({length: data.meta.pages}, (_,i) => i+1).slice(Math.max(0, data.meta.page - 3), data.meta.page + 2).map((page) => <button key={page} onClick={() => update('page', String(page))} className={`grid size-11 place-items-center rounded-full text-sm font-bold ${page === data.meta.page ? 'bg-ink text-white' : 'border border-ink/15'}`}>{page}</button>)}<button disabled={data.meta.page >= data.meta.pages} onClick={() => update('page', String(data.meta.page + 1))} className="grid size-11 place-items-center rounded-full border border-ink/15 disabled:opacity-30"><ChevronRight/></button></div>}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) { return <div className="mb-8 border-b border-ink/10 pb-6"><h3 className="mb-4 text-xs font-extrabold uppercase tracking-widest text-steel">{title}</h3><div className="grid max-h-56 gap-2 overflow-auto no-scrollbar">{children}</div></div>; }
function FilterRadio({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) { return <button onClick={onClick} className={`flex items-center gap-3 rounded-xl px-2 py-2 text-left text-sm ${active ? 'bg-lime font-extrabold' : 'hover:bg-white'}`}><span className={`size-2 rounded-full ${active ? 'bg-ink' : 'bg-ink/20'}`}/>{label}</button>; }
