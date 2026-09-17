'use client';

import { ArrowRight, BadgeCheck, Headphones, PackageCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Category, ProductList } from '@/lib/types';
import { ProductCard } from './product-card';
import { useI18n } from './providers/i18n-provider';
import { VehicleFinder } from './vehicle-finder';

const heroImage = 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1800&q=88';

export function HomeContent() {
  const { locale, t } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [popular, setPopular] = useState<ProductList | null>(null);
  const [newest, setNewest] = useState<ProductList | null>(null);
  const [deals, setDeals] = useState<ProductList | null>(null);
  const apiLocale = locale.toUpperCase();
  useEffect(() => {
    void Promise.all([
      api<Category[]>(`/categories?locale=${apiLocale}`),
      api<ProductList>(`/products?locale=${apiLocale}&sort=popularity&limit=4`),
      api<ProductList>(`/products?locale=${apiLocale}&sort=newest&limit=4`),
      api<ProductList>(`/products?locale=${apiLocale}&discounted=true&limit=4`),
    ]).then(([c, p, n, d]) => { setCategories(c); setPopular(p); setNewest(n); setDeals(d); }).catch(() => undefined);
  }, [apiLocale]);

  return (
    <>
      <section className="container-page pt-5">
        <div className="relative min-h-[650px] overflow-hidden rounded-[2.5rem] bg-ink text-white">
          <Image src={heroImage} fill priority alt="Mechanic working in a modern automotive workshop" className="object-cover opacity-40"/>
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-transparent"/>
          <div className="absolute inset-0 bg-grid bg-[size:42px_42px]"/>
          <div className="relative flex min-h-[650px] max-w-3xl flex-col justify-center p-8 sm:p-14 lg:p-20">
            <p className="eyebrow !text-lime">{t('hero.eyebrow')}</p>
            <h1 className="mt-5 font-display text-5xl font-bold leading-[.96] tracking-[-.05em] sm:text-7xl lg:text-[6rem]">{t('hero.title')}</h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/70 sm:text-xl">{t('hero.text')}</p>
            <div className="mt-9 flex flex-wrap gap-3"><Link className="btn-lime" href={`/${locale}/catalog`}>{t('hero.shop')} <ArrowRight size={18}/></Link><a className="inline-flex items-center rounded-full border border-white/25 px-5 py-3 text-sm font-bold hover:bg-white/10" href="#fitment">{t('hero.fitment')}</a></div>
            <div className="mt-14 grid max-w-2xl grid-cols-3 gap-5 border-t border-white/15 pt-7"><Stat value="1,500+" label={t('hero.stat1')}/><Stat value="98%" label={t('hero.stat2')}/><Stat value="30" label={t('hero.stat3')}/></div>
          </div>
        </div>
      </section>

      <VehicleFinder />

      <section className="container-page py-24">
        <SectionTitle eyebrow="01 / Systems" title={t('home.categories')} text={t('home.categoriesText')} link={`/${locale}/catalog`} linkText={t('common.viewAll')}/>
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((category, index) => <Link key={category.id} href={`/${locale}/catalog?category=${category.slug}`} className={`group rounded-[1.5rem] border border-ink/10 p-5 transition hover:-translate-y-1 hover:bg-ink hover:text-white ${index === 0 ? 'bg-ink text-white lg:col-span-2' : 'bg-white'}`}><span className="text-3xl">{category.icon}</span><h3 className="mt-8 font-display text-lg font-bold">{category.name}</h3><p className={`mt-1 text-xs ${index === 0 ? 'text-white/50' : 'text-steel'}`}>{category._count.products} parts</p></Link>)}
        </div>
      </section>

      <ProductSection index="02" title={t('home.popular')} list={popular} locale={locale}/>

      <section className="container-page py-24">
        <div className="rounded-[2.5rem] bg-orange p-8 text-white sm:p-12 lg:flex lg:items-end lg:justify-between">
          <div><p className="text-xs font-extrabold uppercase tracking-[.22em] text-white/70">Built for confidence</p><h2 className="mt-3 max-w-2xl font-display text-4xl font-bold sm:text-6xl">{t('home.benefits')}</h2></div>
          <div className="mt-10 grid gap-4 lg:mt-0 lg:grid-cols-3">
            <Benefit icon={<BadgeCheck/>} title={t('home.precision')} text={t('home.precisionText')}/><Benefit icon={<PackageCheck/>} title={t('home.fast')} text={t('home.fastText')}/><Benefit icon={<Headphones/>} title={t('home.support')} text={t('home.supportText')}/>
          </div>
        </div>
      </section>

      <ProductSection index="03" title={t('home.newest')} list={newest} locale={locale}/>
      <ProductSection index="04" title={t('home.deals')} list={deals} locale={locale}/>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) { return <div><b className="font-display text-2xl text-lime sm:text-3xl">{value}</b><p className="mt-1 text-[10px] uppercase tracking-wider text-white/50 sm:text-xs">{label}</p></div>; }
function SectionTitle({ eyebrow, title, text, link, linkText }: { eyebrow: string; title: string; text: string; link: string; linkText: string }) { return <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"><div><p className="eyebrow">{eyebrow}</p><h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">{title}</h2><p className="mt-3 max-w-xl text-steel">{text}</p></div><Link href={link} className="btn-outline w-fit">{linkText}<ArrowRight size={16}/></Link></div>; }
function ProductSection({ index, title, list, locale }: { index: string; title: string; list: ProductList | null; locale: string }) { const { t } = useI18n(); return <section className="container-page py-14"><SectionTitle eyebrow={`${index} / Curated`} title={title} text="" link={`/${locale}/catalog`} linkText={t('common.viewAll')}/><div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{list ? list.items.map((p) => <ProductCard key={p.id} product={p}/>) : Array.from({length:4}, (_, i) => <div key={i} className="h-[430px] animate-pulse rounded-[1.75rem] bg-ink/5"/>)}</div></section>; }
function Benefit({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="max-w-[230px] rounded-3xl bg-white/10 p-5 backdrop-blur"><span className="text-lime">{icon}</span><h3 className="mt-5 font-display font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-white/65">{text}</p></div>; }
