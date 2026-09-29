import { notFound } from 'next/navigation';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { locales } from '@/lib/i18n';

export function generateStaticParams() { return locales.map((locale) => ({ locale })); }

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as 'en' | 'uk' | 'ru')) notFound();
  return <><Header locale={locale} /><main>{children}</main><Footer locale={locale} /></>;
}
