import { redirect } from 'next/navigation';

export default async function AppIndex({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; redirect(`/${locale}/app/dashboard`); }
