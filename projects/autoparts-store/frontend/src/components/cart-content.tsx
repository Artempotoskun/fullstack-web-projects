'use client';

import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { money } from '@/lib/api';
import type { Cart } from '@/lib/types';
import { useAuth } from './providers/auth-provider';
import { useI18n } from './providers/i18n-provider';

export function CartContent() {
  const { locale, t } = useI18n();
  const { user, loading, authenticatedFetch } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const load = useCallback(() => authenticatedFetch<Cart>(`/cart?locale=${locale.toUpperCase()}`).then(setCart).catch(() => setCart(null)), [authenticatedFetch, locale]);
  useEffect(() => { if (!loading && !user) router.replace(`/${locale}/login?next=/${locale}/cart`); else if (user) void load(); }, [loading, user, router, locale, load]);
  const update = async (id: string, quantity: number) => { if (quantity < 1) return; await authenticatedFetch(`/cart/items/${id}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }); await load(); window.dispatchEvent(new Event('cart-updated')); };
  const remove = async (id: string) => { await authenticatedFetch(`/cart/items/${id}`, { method: 'DELETE' }); await load(); window.dispatchEvent(new Event('cart-updated')); };
  if (!cart) return <div className="container-page py-20"><div className="h-96 animate-pulse rounded-[2rem] bg-ink/5"/></div>;
  return (
    <div className="container-page py-12">
      <p className="eyebrow">Your workshop order</p><h1 className="mt-3 font-display text-5xl font-bold sm:text-6xl">{t('cart.title')}</h1>
      {!cart.items.length ? <div className="panel mt-10 grid min-h-[420px] place-items-center p-8 text-center"><div><span className="mx-auto grid size-20 place-items-center rounded-full bg-lime"><ShoppingBag size={32}/></span><p className="mt-6 text-xl font-bold text-steel">{t('cart.empty')}</p><Link className="btn-primary mt-6" href={`/${locale}/catalog`}>{t('hero.shop')}<ArrowRight size={17}/></Link></div></div> :
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-4">{cart.items.map((item) => <article key={item.id} className="grid grid-cols-[100px_1fr] gap-5 rounded-[1.75rem] bg-white p-4 sm:grid-cols-[130px_1fr_auto] sm:items-center"><div className="relative aspect-square overflow-hidden rounded-2xl bg-fog">{item.product.image && <Image src={item.product.image} fill sizes="130px" alt={item.product.name} className="object-cover"/>}</div><div><p className="text-xs font-bold uppercase tracking-wider text-steel">{item.product.manufacturer}</p><Link href={`/${locale}/product/${item.product.id}`} className="mt-1 block font-display text-lg font-bold hover:text-orange">{item.product.name}</Link><p className="mt-1 text-xs text-steel">{item.product.sku}</p><div className="mt-4 flex w-fit items-center rounded-full border border-ink/15"><button onClick={() => void update(item.id, item.quantity - 1)} className="grid size-9 place-items-center"><Minus size={14}/></button><b className="w-8 text-center text-sm">{item.quantity}</b><button disabled={item.quantity >= item.product.stockQuantity} onClick={() => void update(item.id, item.quantity + 1)} className="grid size-9 place-items-center disabled:opacity-30"><Plus size={14}/></button></div></div><div className="col-span-2 flex items-center justify-between border-t border-ink/10 pt-4 sm:col-span-1 sm:block sm:border-0 sm:pt-0 sm:text-right"><b className="font-display text-xl">{money(item.line.total, locale)}</b><button onClick={() => void remove(item.id)} className="ml-auto mt-3 flex items-center gap-2 text-xs font-bold text-red-600 sm:justify-end"><Trash2 size={14}/>{t('cart.remove')}</button></div></article>)}</div>
        <aside className="h-fit rounded-[2rem] bg-ink p-7 text-white lg:sticky lg:top-28"><h2 className="font-display text-2xl font-bold">{t('checkout.summary')}</h2><div className="mt-7 grid gap-4 text-sm"><Row label={t('cart.subtotal')} value={money(cart.totals.subtotal, locale)}/><Row label={t('cart.discount')} value={`−${money(cart.totals.discount, locale)}`} highlight/><Row label={t('cart.shipping')} value={cart.totals.total >= 100 ? 'FREE' : money(8.9, locale)}/></div><div className="my-6 border-t border-white/15"/><div className="flex items-end justify-between"><span className="font-bold">{t('cart.total')}</span><b className="font-display text-3xl">{money(cart.totals.total + (cart.totals.total >= 100 ? 0 : 8.9), locale)}</b></div><Link href={`/${locale}/checkout`} className="btn-lime mt-7 w-full">{t('cart.checkout')}<ArrowRight size={17}/></Link><p className="mt-4 text-center text-xs text-white/40">Taxes included · Secure demo checkout</p></aside>
      </div>}
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) { return <div className="flex justify-between"><span className="text-white/55">{label}</span><b className={highlight ? 'text-lime' : ''}>{value}</b></div>; }
