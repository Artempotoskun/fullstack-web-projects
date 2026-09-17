import { Suspense } from 'react';
import { BookingContent } from '@/components/booking-content';
export default async function BookPage({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; return <Suspense><BookingContent locale={locale} /></Suspense>; }
