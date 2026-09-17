'use client';

import { CheckCircle2, ChevronRight, Minus, PackageCheck, Plus, ShieldCheck, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, money } from '@/lib/api';
import type { Product, ProductList } from '@/lib/types';
import { ProductCard } from './product-card';
import { useAuth } from './providers/auth-provider';
import { useI18n } from './providers/i18n-provider';

export function ProductContent({ id }: { id: string }) {
  const { locale, t } = useI18n();
  const { user, authenticatedFetch } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  useEffect(() => {
    const loc = locale.toUpperCase();
    void api<Product>(`/products/${id}?locale=${loc}`).then((item) => {
      setProduct(item);
      return api<ProductList>(`/products?locale=${loc}&category=${item.category.slug}&limit=4`);
    }).then((list) => setRelated(list.items.filter((item) => item.id !== id).slice(0, 3))).catch(() => setProduct(null));
  }, [id, locale]);
  if (!product) return <div className="container-page py-24"><div className="h-[600px] animate-pulse rounded-[2.5rem] bg-ink/5"/></div>;
  const current = product.price * (1 - product.discountPercent / 100);
  const add = async () => {
    if (!user) return router.push(`/${locale}/login?next=/${locale}/product/${id}`);
    setBusy(true);
    try { await authenticatedFetch('/cart/items', { method: 'POST', body: JSON.stringify({ productId: id, quantity }) }); setAdded(true); window.dispatchEvent(new Event('cart-updated')); setTimeout(() => setAdded(false), 1800); }
    finally { setBusy(false); }
  };
  return (
    <div className="container-page py-10">
      <div className="mb-8 flex items-center gap-2 text-sm text-steel"><Link href={`/${locale}/catalog`}>{t('nav.catalog')}</Link><ChevronRight size={14}/><Link href={`/${locale}/catalog?category=${product.category.slug}`}>{product.category.name}</Link><ChevronRight size={14}/><span className="truncate text-ink">{product.name}</span></div>
      <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr]">
        <div className="grid gap-4 sm:grid-cols-[88px_1fr]">
          <div className="order-2 flex gap-3 overflow-auto sm:order-1 sm:flex-col">{product.images.map((image, index) => <button key={image} onClick={() => setSelectedImage(index)} className={`relative aspect-square min-w-20 overflow-hidden rounded-2xl border-2 bg-white ${selectedImage === index ? 'border-orange' : 'border-transparent'}`}><Image src={image} fill sizes="90px" alt="" className="object-cover"/></button>)}</div>
          <div className="relative order-1 aspect-square overflow-hidden rounded-[2.5rem] bg-white sm:order-2">{product.discountPercent > 0 && <span className="absolute left-6 top-6 z-10 rounded-full bg-orange px-4 py-2 text-sm font-extrabold text-white">−{product.discountPercent}%</span>}<Image src={product.images[selectedImage]} fill priority sizes="(max-width: 1024px) 90vw, 50vw" alt={product.name} className="object-cover"/></div>
        </div>
        <div className="lg:py-5">
          <p className="eyebrow">{product.manufacturer.name}</p><h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-6xl">{product.name}</h1>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-steel"><span className="rounded-full bg-white px-3 py-2">{t('product.sku')}: {product.sku}</span><span className="rounded-full bg-white px-3 py-2">{t('product.oem')}: {product.oemNumber}</span></div>
          <p className="mt-8 text-lg leading-relaxed text-steel">{product.description}</p>
          <div className="my-8 flex items-end gap-3 border-y border-ink/10 py-7"><b className="font-display text-4xl">{money(current, locale)}</b>{product.discountPercent > 0 && <span className="pb-1 text-lg text-steel line-through">{money(product.price, locale)}</span>}</div>
          <div className="mb-6 flex items-center gap-2 font-bold text-emerald-600"><CheckCircle2 size={19}/>{product.stockQuantity > 0 ? `${t('common.inStock')} · ${product.stockQuantity}` : t('common.outOfStock')}</div>
          <div className="flex flex-col gap-3 sm:flex-row"><div className="flex h-13 items-center justify-between rounded-full border border-ink/15 bg-white p-1"><button className="grid size-11 place-items-center" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={17}/></button><b className="w-9 text-center">{quantity}</b><button className="grid size-11 place-items-center" onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}><Plus size={17}/></button></div><button disabled={busy || product.stockQuantity < 1} onClick={() => void add()} className={`btn-primary flex-1 ${added ? '!bg-emerald-600' : ''}`}>{added ? <CheckCircle2/> : <ShoppingBag/>}{added ? t('cart.title') : t('common.addToCart')}</button></div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2"><div className="flex items-center gap-3 rounded-2xl bg-white p-4"><ShieldCheck className="text-orange"/><span className="text-sm font-bold">{t('product.warranty')}</span></div><div className="flex items-center gap-3 rounded-2xl bg-white p-4"><PackageCheck className="text-orange"/><span className="text-sm font-bold">{t('product.shipping')}</span></div></div>
        </div>
      </div>
      <div className="mt-20 grid gap-6 lg:grid-cols-2">
        <section className="panel p-7 sm:p-10"><h2 className="font-display text-2xl font-bold">{t('product.fitment')}</h2><div className="mt-6 grid gap-3">{product.compatibility.map((item) => <div key={item.id} className="flex items-center justify-between rounded-2xl bg-fog p-4"><span><b>{item.make} {item.model}</b><span className="ml-2 text-sm text-steel">{item.engine}</span></span><span className="text-xs font-bold">{item.fromYear}–{item.toYear}</span></div>)}</div></section>
        <section className="panel p-7 sm:p-10"><h2 className="font-display text-2xl font-bold">{t('product.specifications')}</h2><dl className="mt-6 divide-y divide-ink/10">{Object.entries(product.specifications).map(([key, value]) => <div key={key} className="flex justify-between py-4"><dt className="capitalize text-steel">{key}</dt><dd className="font-bold">{String(value)}</dd></div>)}</dl></section>
      </div>
      {related.length > 0 && <section className="mt-24"><h2 className="font-display text-4xl font-bold">{t('product.related')}</h2><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map((item) => <ProductCard key={item.id} product={item}/>)}</div></section>}
    </div>
  );
}
