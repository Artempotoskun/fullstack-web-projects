import { AdminContent } from '@/components/admin-content';
export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; return <AdminContent locale={locale} />; }
