'use client';

import { ChevronDown, LogOut, PackageOpen, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { money } from '@/lib/api';
import type { Order, User } from '@/lib/types';
import { useAuth } from './providers/auth-provider';
import { useI18n } from './providers/i18n-provider';

export function AccountContent() {
  const { locale, t } = useI18n();
  const { user, loading, authenticatedFetch, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [saved, setSaved] = useState(false);
  const load = useCallback(() => authenticatedFetch<Order[]>('/orders/mine').then(setOrders), [authenticatedFetch]);
  useEffect(() => { if (!loading && !user) router.replace(`/${locale}/login`); else if (user) void load(); }, [loading, user, locale, router, load]);
  const save = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); await authenticatedFetch<User>('/users/me', { method: 'PATCH', body: JSON.stringify(values) }); setSaved(true); setTimeout(() => setSaved(false), 1500); };
  if (!user) return <div className="container-page py-20"><div className="h-96 animate-pulse rounded-[2rem] bg-ink/5"/></div>;
  return (
    <div className="container-page py-12">
      <div className="flex flex-col gap-6 border-b border-ink/10 pb-10 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">{user.email}</p><h1 className="mt-3 font-display text-5xl font-bold">{t('account.title')}</h1></div><button onClick={() => void logout().then(() => router.push(`/${locale}`))} className="btn-outline w-fit"><LogOut size={17}/>{t('auth.logout')}</button></div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[340px_1fr]">
        <aside className="panel h-fit p-7"><span className="grid size-16 place-items-center rounded-full bg-lime"><UserRound size={28}/></span><h2 className="mt-5 font-display text-2xl font-bold">{user.firstName} {user.lastName}</h2><p className="text-sm text-steel">{user.role}</p><form onSubmit={(e) => void save(e)} className="mt-7 grid gap-4"><label className="text-sm font-bold">{t('auth.firstName')}<input name="firstName" defaultValue={user.firstName} className="field mt-2"/></label><label className="text-sm font-bold">{t('auth.lastName')}<input name="lastName" defaultValue={user.lastName} className="field mt-2"/></label><label className="text-sm font-bold">{t('checkout.phone')}<input name="phone" defaultValue={user.phone} className="field mt-2"/></label><button className="btn-primary">{saved ? '✓' : t('common.save')}</button></form></aside>
        <section><div className="mb-6 flex items-center gap-3"><PackageOpen className="text-orange"/><h2 className="font-display text-3xl font-bold">{t('account.orders')}</h2></div>{orders.length ? <div className="grid gap-4">{orders.map((order) => <OrderRow key={order.id} order={order} locale={locale} status={t(`status.${order.status}`)}/>)}</div> : <div className="panel grid min-h-72 place-items-center p-8 text-center text-steel">{t('account.noOrders')}</div>}</section>
      </div>
    </div>
  );
}

function OrderRow({ order, locale, status }: { order: Order; locale: string; status: string }) { const [open, setOpen] = useState(false); return <article className="panel overflow-hidden"><button onClick={() => setOpen(!open)} className="grid w-full grid-cols-2 items-center gap-4 p-5 text-left sm:grid-cols-[1fr_1fr_1fr_auto]"><div><p className="text-xs text-steel">Order</p><b>{order.number}</b></div><div><p className="text-xs text-steel">Date</p><b>{new Date(order.createdAt).toLocaleDateString(locale)}</b></div><div><p className="text-xs text-steel">Total</p><b>{money(order.total, locale)}</b></div><span className="flex items-center gap-3 rounded-full bg-fog px-3 py-2 text-xs font-bold"><i className="size-2 rounded-full bg-orange"/>{status}<ChevronDown size={15} className={open ? 'rotate-180' : ''}/></span></button>{open && <div className="border-t border-ink/10 px-5 py-4">{order.items.map((item) => <div key={item.id} className="flex justify-between py-2 text-sm"><span className="text-steel">{item.quantity}× {item.name}</span><b>{money(item.lineTotal, locale)}</b></div>)}</div>}</article>; }
