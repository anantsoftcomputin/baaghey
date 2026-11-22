"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { ProductDetail } from "@/components/ProductDetail";
import { StoreHeader } from "@/components/StoreHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { productSlug } from "@/lib/catalog";
import { useCatalog } from "@/hooks/useCatalog";

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const { activeProducts, categories, ready } = useCatalog();
  const product = useMemo(() => activeProducts.find((item) => productSlug(item) === params.slug || item.id === params.slug), [activeProducts, params.slug]);
  const related = useMemo(() => {
    if (!product) return [];
    const sameCategory = activeProducts.filter((item) => item.category === product.category && item.id !== product.id);
    const others = activeProducts.filter((item) => item.category !== product.category);
    return [...sameCategory, ...others].slice(0, 4);
  }, [activeProducts, product]);
  const category = categories.find((item) => item.id === product?.category);

  return (
    <main className="min-h-screen">
      <StoreHeader />
      <section className="container-max gutter pb-24 pt-[116px]">
        <nav aria-label="Breadcrumb" className="mb-6 flex gap-2 text-[10px] uppercase tracking-[0.14em] text-mute">
          <Link href="/" className="hover:text-ink">Home</Link><span>/</span>
          <Link href="/shop" className="hover:text-ink">Clothing</Link>
          {category && <><span>/</span><Link href={`/shop?category=${category.id}`} className="hover:text-ink">{category.name}</Link></>}
        </nav>
        {product ? (
          <ProductDetail product={product} related={related} variant="page" />
        ) : !ready ? (
          <p role="status" className="py-24 text-center text-[13px] text-mute">Loading this piece…</p>
        ) : (
          <div className="py-24 text-center">
            <h1 className="page-title">This piece is no longer available</h1>
            <p className="mt-3 text-[13px] text-mute">It may have sold out or been retired from the collection.</p>
            <Link href="/shop" className="btn btn-primary mt-8">Continue shopping</Link>
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
