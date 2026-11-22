import { ProductModal } from "@/components/ProductModal";

export default async function InterceptedProduct({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductModal key="product-modal" slug={slug} />;
}
