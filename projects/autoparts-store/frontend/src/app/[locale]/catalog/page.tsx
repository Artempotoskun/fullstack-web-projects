import { Suspense } from 'react';
import { CatalogContent } from '@/components/catalog-content';

export default function CatalogPage() {
  return <Suspense fallback={<div className="container-page py-24"><div className="h-96 animate-pulse rounded-[2rem] bg-ink/5"/></div>}><CatalogContent /></Suspense>;
}
