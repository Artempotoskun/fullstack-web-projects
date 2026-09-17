'use client';

import { ArrowUpRight, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '../providers/i18n-provider';

export function Footer() {
  const { locale, t } = useI18n();
  return (
    <footer className="mt-24 bg-ink text-white">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="mb-5 flex items-center gap-3 font-display text-2xl font-bold"><span className="grid size-11 place-items-center rounded-2xl bg-lime text-ink"><Wrench /></span>AUTOPARTS</div>
          <p className="max-w-sm text-lg text-white/60">{t('footer.text')}</p>
        </div>
        <div><p className="mb-4 text-xs font-bold uppercase tracking-widest text-lime">{t('footer.shop')}</p><div className="grid gap-3 text-white/65"><Link href={`/${locale}/catalog`}>{t('nav.catalog')}</Link><Link href={`/${locale}/cart`}>{t('nav.cart')}</Link><Link href={`/${locale}/account`}>{t('nav.orders')}</Link></div></div>
        <div><p className="mb-4 text-xs font-bold uppercase tracking-widest text-lime">API</p><a className="inline-flex items-center gap-2 text-white/65" href="http://localhost:4000/api/docs" target="_blank">Swagger documentation <ArrowUpRight size={15}/></a></div>
      </div>
      <div className="container-page border-t border-white/10 py-6 text-sm text-white/40">© 2026 {t('footer.rights')}</div>
    </footer>
  );
}
