import { ProductContent } from '@/components/product-content';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductContent id={id}/>;
}
