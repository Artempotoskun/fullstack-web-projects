'use client';

import { createContext, useContext } from 'react';
import { dictionaries, Locale } from '@/lib/i18n';

type I18nContextValue = { locale: Locale; t: (key: string) => string };
const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const t = (key: string) => {
    const [group, item] = key.split('.');
    const section = dictionaries[locale][group];
    return typeof section === 'object' ? section[item] ?? key : key;
  };
  return <I18nContext.Provider value={{ locale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}
