'use client';

import { ArrowUpRight, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { money } from '@/lib/api';
import type { Product } from '@/lib/types';
import { useAuth } from './providers/auth-provider';
import { useI18n } from './providers/i18n-provider';

export function ProductCard({ product }: { product: Product }) {
  const { locale, t } = useI18n();
  const { user, authenticatedFetch } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const salePrice = product.price * (1 - product.discountPercent / 100);
  const add = async () => {
    if (!user) return router.push(`/${locale}/login?next=/${locale}/product/${product.id}`);
    setBusy(true);
    try {
      await authenticatedFetch('/cart/items', { method: 'POST', body: JSON.stringify({ productId: product.id, quantity: 1 }) });
      window.dispatchEvent(new Event('cart-updated'));
    } finally { setBusy(false); }
  };
  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-ink/10 bg-white transition hover:-translate-y-1 hover:shadow-card">
      <Link href={`/${locale}/product/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-fog">
        {product.discountPercent > 0 && <span className="absolute left-4 top-4 z-10 rounded-full bg-orange px-3 py-1 text-xs font-extrabold text-white">−{product.discountPercent}%</span>}
        {product.images[0] ? <Image src={product.images[0]} fill sizes="(max-width: 768px) 90vw, 25vw" alt={product.name} className="object-cover transition duration-500 group-hover:scale-105"/> : <div className="grid h-full place-items-center text-steel">No image</div>}
        <span className="absolute bottom-4 right-4 grid size-10 translate-y-2 place-items-center rounded-full bg-white opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100"><ArrowUpRight size={18}/></span>
      </Link>
      <div className="p-5">
        <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-steel"><span>{product.manufacturer.name}</span><span className={product.stockQuantity > 0 ? 'text-emerald-600' : 'text-red-500'}>● {product.stockQuantity > 0 ? t('common.inStock') : t('common.outOfStock')}</span></div>
        <Link href={`/${locale}/product/${product.id}`} className="line-clamp-2 min-h-12 font-display text-lg font-bold leading-snug hover:text-orange">{product.name}</Link>
        <p className="mt-1 text-xs text-steel">{product.sku} · OEM {product.oemNumber}</p>
        <div className="mt-5 flex items-end justify-between gap-3">
          <div><b className="font-display text-xl">{money(salePrice, locale)}</b>{product.discountPercent > 0 && <span className="ml-2 text-sm text-steel line-through">{money(product.price, locale)}</span>}</div>
          <button disabled={busy || product.stockQuantity < 1} onClick={() => void add()} className="grid size-11 place-items-center rounded-full bg-lime text-ink transition hover:scale-105 disabled:opacity-40" aria-label={t('common.addToCart')}><ShoppingBag size={18}/></button>
        </div>
      </div>
    </article>
  );
}
