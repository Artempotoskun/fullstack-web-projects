import { notFound } from 'next/navigation';
import { Landing } from '@/components/landing';
import { isLocale } from '@/lib/i18n';

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; if (!isLocale(locale)) notFound(); return <Landing locale={locale}/>; }
