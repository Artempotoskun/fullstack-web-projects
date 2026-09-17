import { notFound } from 'next/navigation';
import { AuthProvider } from '@/components/providers/auth-provider';
import { I18nProvider } from '@/components/providers/i18n-provider';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { isLocale, locales } from '@/lib/i18n';

export function generateStaticParams() { return locales.map((locale) => ({ locale })); }

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <I18nProvider locale={locale}>
      <AuthProvider>
        <Header />
        <main className="min-h-[70vh]">{children}</main>
        <Footer />
      </AuthProvider>
    </I18nProvider>
  );
}
