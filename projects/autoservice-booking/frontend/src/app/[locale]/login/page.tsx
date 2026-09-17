import { Suspense } from 'react';
import { AuthForm } from '@/components/auth-form';
export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; return <Suspense><AuthForm locale={locale} mode="login" /></Suspense>; }
