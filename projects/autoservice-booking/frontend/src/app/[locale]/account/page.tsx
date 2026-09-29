import { Suspense } from 'react';
import { AccountContent } from '@/components/account-content';
export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; return <Suspense><AccountContent locale={locale} /></Suspense>; }
