'use client';

import { Menu, Search, ShoppingBag, UserRound, Wrench, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useAuth } from '../providers/auth-provider';
import { useI18n } from '../providers/i18n-provider';
import { api } from '@/lib/api';
import type { Cart } from '@/lib/types';

type Suggestion = { id: string; sku: string; name: string; manufacturer: string };

export function Header() {
  const { locale, t } = useI18n();
  const { user, logout, authenticatedFetch } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const update = () => {
      if (!user) return setCartCount(0);
      void authenticatedFetch<Cart>(`/cart?locale=${locale.toUpperCase()}`)
        .then((cart) => setCartCount(cart.items.reduce((sum, item) => sum + item.quantity, 0)))
        .catch(() => setCartCount(0));
    };
    update(); window.addEventListener('cart-updated', update);
    return () => window.removeEventListener('cart-updated', update);
  }, [user, authenticatedFetch, locale]);

  const onSearch = (value: string) => {
    setSearch(value);
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) return setSuggestions([]);
    timer.current = setTimeout(() => {
      void api<Suggestion[]>(`/products/suggestions?q=${encodeURIComponent(value)}&locale=${locale.toUpperCase()}`)
        .then(setSuggestions).catch(() => setSuggestions([]));
    }, 220);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault(); setSuggestions([]);
    router.push(`/${locale}/catalog?search=${encodeURIComponent(search)}`);
  };
  const switchLocale = (next: string) => router.push(pathname.replace(/^\/(en|uk|ru)/, `/${next}`));

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-[#f7f8f6]/95 backdrop-blur-xl">
      <div className="container-page flex h-20 items-center gap-4">
        <Link href={`/${locale}`} className="flex shrink-0 items-center gap-2 font-display text-xl font-bold tracking-tight">
          <span className="grid size-10 place-items-center rounded-2xl bg-ink text-lime"><Wrench size={21} /></span>
          <span className="hidden sm:inline">AUTO<span className="text-orange">PARTS</span></span>
        </Link>

        <form onSubmit={submit} className="relative mx-auto hidden max-w-xl flex-1 lg:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-steel" size={18} />
          <input value={search} onChange={(e) => onSearch(e.target.value)} className="field py-2.5 pl-11" placeholder={t('common.search')} />
          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+.5rem)] overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-card">
              {suggestions.map((item) => (
                <Link key={item.id} onClick={() => setSuggestions([])} href={`/${locale}/product/${item.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-fog">
                  <span><b>{item.name}</b><span className="ml-2 text-sm text-steel">{item.manufacturer}</span></span>
                  <span className="text-xs font-bold text-steel">{item.sku}</span>
                </Link>
              ))}
            </div>
          )}
        </form>

        <nav className="hidden items-center gap-5 xl:flex">
          <Link className="text-sm font-bold hover:text-orange" href={`/${locale}/catalog`}>{t('nav.catalog')}</Link>
          {user && <Link className="text-sm font-bold hover:text-orange" href={`/${locale}/account`}>{t('nav.orders')}</Link>}
          {user?.role === 'ADMIN' && <Link className="text-sm font-bold hover:text-orange" href={`/${locale}/admin`}>{t('nav.admin')}</Link>}
        </nav>

        <select aria-label="Language" value={locale} onChange={(e) => switchLocale(e.target.value)} className="rounded-full border border-ink/15 bg-transparent px-2 py-2 text-xs font-extrabold uppercase">
          <option value="en">EN</option><option value="uk">UA</option><option value="ru">RU</option>
        </select>

        {user ? (
          <button onClick={() => void logout()} className="hidden rounded-full border border-ink/15 px-4 py-2 text-sm font-bold md:block" title={t('auth.logout')}>
            {user.firstName}
          </button>
        ) : (
          <Link href={`/${locale}/login`} className="grid size-10 place-items-center rounded-full border border-ink/15" aria-label={t('nav.login')}><UserRound size={18} /></Link>
        )}
        <Link href={`/${locale}/cart`} className="relative grid size-10 place-items-center rounded-full bg-ink text-white" aria-label={t('nav.cart')}>
          <ShoppingBag size={18} />
          {cartCount > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-orange text-[10px] font-bold">{cartCount}</span>}
        </Link>
        <button onClick={() => setMobile(!mobile)} className="grid size-10 place-items-center xl:hidden" aria-label="Menu">{mobile ? <X /> : <Menu />}</button>
      </div>
      {mobile && (
        <div className="container-page border-t border-ink/10 py-4 xl:hidden">
          <form onSubmit={submit} className="relative mb-4 lg:hidden"><Search className="absolute left-4 top-1/2 -translate-y-1/2" size={17}/><input className="field pl-11" value={search} onChange={(e) => onSearch(e.target.value)} placeholder={t('common.search')} /></form>
          <div className="grid gap-1">
            <Link onClick={() => setMobile(false)} className="rounded-xl p-3 font-bold hover:bg-white" href={`/${locale}/catalog`}>{t('nav.catalog')}</Link>
            {user && <Link onClick={() => setMobile(false)} className="rounded-xl p-3 font-bold hover:bg-white" href={`/${locale}/account`}>{t('nav.orders')}</Link>}
            {user?.role === 'ADMIN' && <Link onClick={() => setMobile(false)} className="rounded-xl p-3 font-bold hover:bg-white" href={`/${locale}/admin`}>{t('nav.admin')}</Link>}
          </div>
        </div>
      )}
    </header>
  );
}
