import { notFound } from 'next/navigation';
import { FinanceApp } from '@/components/finance-app';
import { isLocale } from '@/lib/i18n';
import { sections, type Section } from '@/lib/sections';

export function generateStaticParams() { return sections.map((section) => ({ section })); }
export default async function WorkspacePage({ params }: { params: Promise<{ locale: string; section: string }> }) { const { locale, section } = await params; if (!isLocale(locale) || !sections.includes(section as Section)) notFound(); return <FinanceApp locale={locale} section={section as Section}/>; }
