'use client';

import { Bell, CalendarCheck2, LogOut, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { dictionary, locales } from '@/lib/i18n';
import { useAuth } from '../providers/auth-provider';

export function Header({ locale }: { locale: string }) {
  const d = dictionary(locale);
  const pathname = usePathname();
  const { user, logout, request } = useAuth();
  const [unread, setUnread] = useState(0);
  useEffect(() => { if (user) void request<{ count: number }>('/notifications/unread-count').then((r) => setUnread(r.count)).catch(() => undefined); }, [request, user]);
  const localePath = (next: string) => pathname.replace(/^\/(en|uk|ru)/, `/${next}`);
  return <header className="site-header">
    <div className="shell nav-wrap">
      <Link className="brand" href={`/${locale}`}><span className="brand-mark"><CalendarCheck2 size={21} /></span><span>AutoService<small>booking platform</small></span></Link>
      <nav className="nav-links">
        <Link href={`/${locale}#services`}>{d.nav.services}</Link><Link href={`/${locale}#process`}>{d.nav.process}</Link><Link href={`/${locale}#locations`}>{d.nav.locations}</Link>
        {user && <Link href={`/${locale}/account`}>{d.nav.account}</Link>}{user?.role === 'ADMIN' && <Link href={`/${locale}/admin`}>{d.nav.admin}</Link>}
      </nav>
      <div className="locale-switch">{locales.map((item) => <Link className={item === locale ? 'active' : ''} href={localePath(item)} key={item}>{item}</Link>)}</div>
      {user ? <div className="nav-user"><Link href={`/${locale}/account`} className="avatar" title={`${unread} notifications`}>{unread ? <Bell size={16} /> : user.firstName[0]}</Link><button className="button button-ghost button-sm" onClick={() => void logout()}><LogOut size={14} />{d.nav.logout}</button></div> : <Link className="button button-ghost button-sm" href={`/${locale}/login`}>{d.nav.login}</Link>}
      <Link className="button button-primary button-sm" href={`/${locale}/book`}><CalendarCheck2 size={16} />{d.nav.book}</Link>
      <button className="mobile-toggle" aria-label="Menu"><Menu /></button>
    </div>
  </header>;
}
