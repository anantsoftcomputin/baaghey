"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StoreHeader } from "@/components/StoreHeader";
import { BottomNav } from "@/components/BottomNav";
import { categoryMedia, formatPrice, productHref } from "@/lib/catalog";
import { firebaseReady, subscribeCategories, subscribeProducts } from "@/lib/firebase";
import {
  bandhaniTechniques,
  categories as seedCategories,
  products as seedProducts,
  type Category,
  type Product,
} from "@/lib/products";

export default function CollectionsPage() {
  const [categories, setCategories] = useState<Category[]>(seedCategories);
  const [products, setProducts] = useState<Product[]>(seedProducts);

  useEffect(() => {
    if (!firebaseReady) return;
    const unsubscribeCategories = subscribeCategories((items) => items.length && setCategories(items));
    const unsubscribeProducts = subscribeProducts((items) => items.length && setProducts(items));
    return () => {
      unsubscribeCategories();
      unsubscribeProducts();
    };
  }, []);

  const activeProducts = useMemo(() => products.filter((product) => product.status === "active"), [products]);

  const categoryStats = useMemo(() => {
    return [...categories]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => {
        const items = activeProducts.filter((product) => product.category === category.id);
        const prices = items.map((product) => product.salePrice ?? product.price);
        const cover = items.find((product) => product.featured && product.photo) ?? items.find((product) => product.photo);
        const subcategoryCounts = (category.subcategories ?? []).map((sub) => ({
          sub,
          count: items.filter((product) => product.subcategory === sub.id).length,
        }));
        return {
          category,
          count: items.length,
          minPrice: prices.length ? Math.min(...prices) : undefined,
          maxPrice: prices.length ? Math.max(...prices) : undefined,
          media: categoryMedia(category, cover?.photo),
          subcategoryCounts,
        };
      });
  }, [categories, activeProducts]);

  const colourGroups = useMemo(() => {
    const byColour = new Map<string, Product>();
    for (const product of activeProducts) {
      if (product.photo && !byColour.has(product.color)) byColour.set(product.color, product);
    }
    return Array.from(byColour.entries()).map(([colour, product]) => ({
      colour,
      product,
      count: activeProducts.filter((item) => item.color === colour).length,
    }));
  }, [activeProducts]);

  const techniqueExamples = useMemo(() => {
    return bandhaniTechniques.map((technique) => ({
      technique,
      example: activeProducts.find((product) => technique.exampleIds.includes(product.id) && product.photo),
    }));
  }, [activeProducts]);

  return (
    <main className="min-h-screen pb-16 text-black lg:pb-0">
      <StoreHeader count={activeProducts.length} />

      <section className="container-max px-4 pb-8 pt-28 sm:px-6 lg:px-10">
        <h1 className="text-4xl font-bold sm:text-5xl">Collections</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-mute">
          {activeProducts.length} hand-tied pieces across {categoryStats.length} categories — every dot pinched and dyed by hand across Kutch and Saurashtra.
        </p>
      </section>

      {/* Category tiles with subcategories */}
      <section className="container-max px-4 pb-16 sm:px-6 lg:px-10">
        <div className="grid gap-6 md:grid-cols-3">
          {categoryStats.map(({ category, count, minPrice, maxPrice, media, subcategoryCounts }) => (
            <article key={category.id} className="flex flex-col border border-line">
              <Link href={`/shop?category=${category.id}`} className="group relative block aspect-[4/5] overflow-hidden bg-[#f4f4f4]">
                {media?.type === "video" ? (
                  <video className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" src={media.src} autoPlay muted loop playsInline />
                ) : media?.type === "photo" ? (
                  <Image src={media.src} alt={category.name} fill sizes="(max-width: 768px) 90vw, 33vw" className="object-cover object-[center_18%] transition duration-300 group-hover:scale-[1.03]" />
                ) : null}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <h2 className="text-2xl font-bold">{category.name}</h2>
                </div>
              </Link>

              <div className="flex flex-1 flex-col p-5">
                <p className="text-sm leading-6 text-mute">{category.description}</p>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.06em]">
                  <span className="border border-line px-3 py-1.5">{count} {count === 1 ? "piece" : "pieces"}</span>
                  {minPrice !== undefined && (
                    <span className="border border-line px-3 py-1.5 text-accent">
                      {minPrice === maxPrice ? formatPrice(minPrice) : `${formatPrice(minPrice)}–${formatPrice(maxPrice!)}`}
                    </span>
                  )}
                </div>

                {subcategoryCounts.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {subcategoryCounts.map(({ sub, count: subCount }) => (
                      <Link
                        key={sub.id}
                        href={`/shop?category=${category.id}&subcategory=${sub.id}`}
                        className="border border-line px-3 py-1.5 text-xs font-semibold"
                      >
                        {sub.name} {subCount ? `(${subCount})` : ""}
                      </Link>
                    ))}
                  </div>
                )}

                <Link
                  href={`/shop?category=${category.id}`}
                  className="mt-auto inline-flex items-center gap-2 pt-5 text-xs font-bold uppercase tracking-[0.1em]"
                >
                  Shop {category.name} <ArrowRight size={15} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Shop by colour */}
      {colourGroups.length > 0 && (
        <section className="border-t border-line px-4 py-16 sm:px-6 lg:px-10">
          <div className="container-max">
            <div className="mb-8 border-b border-line pb-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-mute">Shop by colour</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">The dye pot palette.</h2>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-2">
              {colourGroups.map(({ colour, product, count }) => (
                <Link key={colour} href={productHref(product)} className="group flex shrink-0 flex-col items-center gap-3">
                  <span className="relative block size-24 overflow-hidden rounded-full border border-line transition duration-300 group-hover:scale-105 sm:size-28">
                    <Image src={product.photo!} alt={colour} fill sizes="112px" className="object-cover object-[center_18%]" />
                  </span>
                  <span className="text-center">
                    <span className="block text-xs font-bold uppercase tracking-[0.06em]">{colour}</span>
                    <span className="block text-[11px] text-mute">{count} {count === 1 ? "piece" : "pieces"}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bandhej glossary */}
      <section className="container-max px-4 py-16 sm:px-6 lg:px-10">
        <div className="mb-10 border-b border-line pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-mute">The Bandhej glossary</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">The ties you&rsquo;ll find.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-mute">
            Every piece in this catalog is named for the way it was actually tied. Here are the four patterns behind them.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {techniqueExamples.map(({ technique, example }) => (
            <article key={technique.id} className="flex flex-col border border-line">
              {example?.photo && (
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image src={example.photo} alt={technique.term} fill sizes="280px" className="object-cover object-[center_15%]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                  <span className="absolute bottom-2 left-3 text-lg font-bold text-white">{technique.term}</span>
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-sm font-bold uppercase tracking-[0.08em]">{technique.title}</h3>
                <p className="mt-2 text-sm leading-6 text-mute">{technique.copy}</p>
                {example && (
                  <Link href={productHref(example)} className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-bold uppercase tracking-[0.08em]">
                    See it on {example.name} <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <BottomNav count={activeProducts.length} />
    </main>
  );
}
