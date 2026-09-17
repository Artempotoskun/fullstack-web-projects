import { HomeContent } from '@/components/home-content';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; return <HomeContent locale={locale} />;
}
