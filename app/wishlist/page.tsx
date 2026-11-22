"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { StoreHeader } from "@/components/StoreHeader";
import { ProductCard } from "@/components/ProductCard";
import { SiteFooter } from "@/components/SiteFooter";
import { PageIntro } from "@/components/PageIntro";
import { useCommerce } from "@/components/CommerceProvider";
import { useCatalog } from "@/hooks/useCatalog";

export default function WishlistPage() {
  const { wishlist, user } = useCommerce();
  const { activeProducts } = useCatalog();
  const products = activeProducts.filter((product) => wishlist.includes(product.id));
  return (
    <main className="min-h-screen">
      <StoreHeader />
      <section className="container-max gutter pb-28 pt-[124px]">
        <PageIntro eyebrow={`${products.length} saved`} title="Saved pieces">{user ? "Synced to your account across devices." : "Saved on this device — sign in to keep them everywhere."}</PageIntro>
        {products.length ? (
          <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        ) : (
          <div className="mt-12 grid min-h-80 place-items-center bg-paper p-10 text-center">
            <div>
              <p className="text-[17px] font-semibold uppercase tracking-[0.1em]">Nothing saved yet.</p>
              <p className="mt-2 text-sm text-mute">Tap the heart on any piece to keep it here.</p>
              <Link href="/shop" className="btn btn-primary mt-7">Browse the edit <ArrowUpRight size={15} /></Link>
            </div>
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
