import { Suspense } from 'react';
import { AuthForm } from '@/components/auth-form';
export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; return <Suspense><AuthForm locale={locale} mode="register" /></Suspense>; }
