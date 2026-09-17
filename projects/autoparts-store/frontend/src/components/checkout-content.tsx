'use client';

import { CheckCircle2, CreditCard, ShieldCheck, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { money } from '@/lib/api';
import type { Cart, Order } from '@/lib/types';
import { useAuth } from './providers/auth-provider';
import { useI18n } from './providers/i18n-provider';

export function CheckoutContent() {
  const { locale, t } = useI18n();
  const { user, loading, authenticatedFetch } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [method, setMethod] = useState('DEMO_CARD');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const load = useCallback(() => authenticatedFetch<Cart>(`/cart?locale=${locale.toUpperCase()}`).then(setCart), [authenticatedFetch, locale]);
  useEffect(() => { if (!loading && !user) router.replace(`/${locale}/login?next=/${locale}/checkout`); else if (user) void load(); }, [loading, user, router, locale, load]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const shippingAddress = { firstName: values.firstName, lastName: values.lastName, phone: values.phone, line1: values.line1, line2: values.line2 || undefined, city: values.city, region: values.region || undefined, postalCode: values.postalCode, country: values.country };
    try { const created = await authenticatedFetch<Order>(`/orders?locale=${locale.toUpperCase()}`, { method: 'POST', body: JSON.stringify({ shippingAddress, paymentMethod: method }) }); setOrder(created); window.dispatchEvent(new Event('cart-updated')); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Checkout failed'); }
    finally { setBusy(false); }
  };
  if (order) return <div className="container-page py-20"><div className="panel mx-auto max-w-2xl p-10 text-center"><span className="mx-auto grid size-20 place-items-center rounded-full bg-lime"><CheckCircle2 size={36}/></span><p className="eyebrow mt-7">{order.number}</p><h1 className="mt-3 font-display text-5xl font-bold">{t('checkout.success')}</h1><p className="mt-5 text-steel">{money(order.total, locale)} · {t(`status.${order.status}`)}</p><button onClick={() => router.push(`/${locale}/account`)} className="btn-primary mt-8">{t('nav.orders')}</button></div></div>;
  if (!cart) return <div className="container-page py-20"><div className="h-96 animate-pulse rounded-[2rem] bg-ink/5"/></div>;
  return (
    <div className="container-page py-12">
      <p className="eyebrow">Secure order flow</p><h1 className="mt-3 font-display text-5xl font-bold sm:text-6xl">{t('checkout.title')}</h1>
      <form onSubmit={(e) => void submit(e)} className="mt-10 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="grid gap-6">
          <section className="panel p-7"><h2 className="font-display text-2xl font-bold">{t('checkout.contact')}</h2><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field name="firstName" label={t('auth.firstName')} defaultValue={user?.firstName}/><Field name="lastName" label={t('auth.lastName')} defaultValue={user?.lastName}/><Field name="phone" label={t('checkout.phone')}/><Field name="country" label={t('checkout.country')} defaultValue="UA" maxLength={2}/></div></section>
          <section className="panel p-7"><h2 className="font-display text-2xl font-bold">{t('checkout.shipping')}</h2><div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Field name="line1" label={t('checkout.line1')}/></div><div className="sm:col-span-2"><Field name="line2" label={t('checkout.line2')} required={false}/></div><Field name="city" label={t('checkout.city')}/><Field name="region" label={t('checkout.region')} required={false}/><Field name="postalCode" label={t('checkout.postal')}/></div></section>
          <section className="panel p-7"><h2 className="font-display text-2xl font-bold">{t('checkout.payment')}</h2><div className="mt-6 rounded-2xl border-2 border-lime bg-lime/15 p-5"><div className="flex gap-3"><ShieldCheck/><div><b className="text-sm">{t('checkout.demo')}</b><p className="mt-1 text-sm text-steel">{t('checkout.demoText')}</p></div></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Payment active={method === 'DEMO_CARD'} onClick={() => setMethod('DEMO_CARD')} icon={<CreditCard/>} label={t('checkout.card')}/><Payment active={method === 'CASH_ON_DELIVERY'} onClick={() => setMethod('CASH_ON_DELIVERY')} icon={<Truck/>} label={t('checkout.cod')}/></div></section>
          {error && <div className="rounded-2xl bg-red-50 p-4 font-bold text-red-700">{error}</div>}
        </div>
        <aside className="h-fit rounded-[2rem] bg-ink p-7 text-white lg:sticky lg:top-28"><h2 className="font-display text-2xl font-bold">{t('checkout.summary')}</h2><div className="mt-6 grid gap-4">{cart.items.map((item) => <div key={item.id} className="flex justify-between gap-3 text-sm"><span className="text-white/65">{item.quantity}× {item.product.name}</span><b>{money(item.line.total, locale)}</b></div>)}</div><div className="my-6 border-t border-white/15"/><div className="flex justify-between"><span>{t('cart.total')}</span><b className="font-display text-2xl">{money(cart.totals.total + (cart.totals.total >= 100 ? 0 : 8.9), locale)}</b></div><button disabled={busy || !cart.items.length} className="btn-lime mt-7 w-full">{t('checkout.place')}</button></aside>
      </form>
    </div>
  );
}

function Field({ name, label, defaultValue, required = true, maxLength }: { name: string; label: string; defaultValue?: string; required?: boolean; maxLength?: number }) { return <label className="block text-sm font-bold">{label}<input name={name} required={required} defaultValue={defaultValue} maxLength={maxLength} className="field mt-2"/></label>; }
function Payment({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) { return <button type="button" onClick={onClick} className={`flex items-center gap-3 rounded-2xl border p-4 text-left font-bold ${active ? 'border-orange bg-orange/5' : 'border-ink/10'}`}>{icon}{label}</button>; }
