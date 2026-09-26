'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { Locale } from '@/lib/i18n';

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();
  const change = (next: Locale) => router.push(pathname.replace(/^\/(en|ua|ru)(?=\/|$)/, `/${next}`));
  return <div className="language-switcher" aria-label="Language">
    {(['en', 'ua', 'ru'] as const).map((item) => <button key={item} className={item === locale ? 'active' : ''} onClick={() => change(item)} aria-pressed={item === locale}>{item === 'ua' ? 'UA' : item.toUpperCase()}</button>)}
  </div>;
}
