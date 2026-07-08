"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StoreHeader } from "@/components/StoreHeader";
import { BottomNav } from "@/components/BottomNav";
import { MotifField, StitchDivider } from "@/components/Motifs";
import { formatPrice, productHref } from "@/lib/catalog";
import { firebaseReady, subscribeCategories, subscribeProducts } from "@/lib/firebase";
import {
  bandhaniTechniques,
  categories as seedCategories,
  products as seedProducts,
  type Category,
  type Product,
} from "@/lib/products";

const TILE_TONES = ["bg-neem text-[#fffdf1]", "bg-gulal text-ink", "bg-sindoor text-[#fffdf1]"];

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
        const thumbs = items.filter((product) => product.photo && product.id !== cover?.id).slice(0, 3);
        return {
          category,
          items,
          cover,
          thumbs,
          count: items.length,
          minPrice: prices.length ? Math.min(...prices) : undefined,
          maxPrice: prices.length ? Math.max(...prices) : undefined,
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
    <main className="min-h-screen text-ink">
      <StoreHeader count={activeProducts.length} />

      <section
        className="relative overflow-hidden bg-fixed bg-cover bg-center px-4 pb-16 pt-36 text-[#fffdf1] sm:px-6 lg:px-10"
        style={{ backgroundImage: "url(/images/Background.png)" }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,20,10,0.82),rgba(10,20,10,0.45)_50%,rgba(10,20,10,0.88))]" />
        <div className="relative z-10 mx-auto max-w-[1500px]">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-kesar">Collections</p>
          <h1 className="mt-3 font-display text-7xl font-bold leading-none tracking-normal">Shop by story.</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/75">
            {activeProducts.length} hand-tied pieces across {categoryStats.length} silhouettes — every dot pinched and dyed by hand across Kutch and Saurashtra.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-4" aria-hidden="true">
        <span className="h-3 bg-neem" />
        <span className="h-3 bg-gulal" />
        <span className="h-3 bg-kesar" />
        <span className="h-3 bg-ink" />
      </div>

      {/* Category cards: real photos, real counts, real price ranges */}
      <section className="relative mx-auto max-w-[1500px] px-4 py-16 sm:px-6 lg:px-10">
        <MotifField variant="a" tone="text-neem" />
        <div className="relative grid gap-6 md:grid-cols-3">
          {categoryStats.map(({ category, cover, thumbs, count, minPrice, maxPrice }, index) => (
            <article key={category.id} className="glass-card group flex min-h-[520px] flex-col overflow-hidden rounded-[24px]">
              <Link href={`/shop?category=${category.id}`} className="relative m-3 block aspect-[4/5] overflow-hidden rounded-[20px] bg-mehendi/10">
                {cover?.photo ? (
                  <Image
                    src={cover.photo}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 90vw, 33vw"
                    className="object-cover object-[center_18%] transition duration-500 group-hover:scale-[1.05]"
                  />
                ) : (
                  <div className={`absolute inset-0 ${TILE_TONES[index % TILE_TONES.length]}`} />
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <span className="absolute left-3 top-3 rounded-full bg-black/45 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#fffdf1] backdrop-blur">
                  0{index + 1}
                </span>
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h2 className="font-display text-3xl font-bold leading-none text-[#fffdf1]">{category.name}</h2>
                </div>
              </Link>

              <div className="m-3 mt-0 flex flex-1 flex-col rounded-[20px] border border-white/35 bg-white/25 p-5 pt-4 backdrop-blur-2xl">
                <p className="text-sm leading-6 text-black/65">{category.description}</p>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.14em]">
                  <span className="rounded-full bg-neem/12 px-3 py-1.5 text-neem">{count} {count === 1 ? "piece" : "pieces"}</span>
                  {minPrice !== undefined && (
                    <span className="rounded-full bg-gulal/12 px-3 py-1.5 text-sindoor">
                      {minPrice === maxPrice ? formatPrice(minPrice) : `${formatPrice(minPrice)}–${formatPrice(maxPrice!)}`}
                    </span>
                  )}
                </div>

                {thumbs.length > 0 && (
                  <div className="mt-4 flex items-center gap-2">
                    {thumbs.map((product) => (
                      <Link
                        key={product.id}
                        href={productHref(product)}
                        className="relative size-11 overflow-hidden rounded-full border-2 border-white shadow-sm"
                        title={product.name}
                      >
                        <Image src={product.photo!} alt={product.name} fill sizes="44px" className="object-cover object-[center_18%]" />
                      </Link>
                    ))}
                    {count > thumbs.length + (cover ? 1 : 0) && (
                      <span className="text-xs font-bold text-black/45">+{count - thumbs.length - (cover ? 1 : 0)} more</span>
                    )}
                  </div>
                )}

                <Link
                  href={`/shop?category=${category.id}`}
                  className="mt-auto inline-flex items-center gap-2 pt-5 text-xs font-black uppercase tracking-[0.18em] text-sindoor"
                >
                  Shop {category.name} <ArrowRight size={15} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Shop by colour — real product photography, not swatch chips */}
      {colourGroups.length > 0 && (
        <section className="relative overflow-hidden bg-[#f6efdd]/70 px-4 py-16 sm:px-6 lg:px-10">
          <MotifField variant="b" tone="text-neem" />
          <div className="relative mx-auto max-w-[1500px]">
            <div className="mb-8 border-b border-mehendi/12 pb-5">
              <p className="text-xs font-black uppercase tracking-[0.26em] text-sindoor">Shop by colour</p>
              <h2 className="mt-2 font-display text-5xl font-bold tracking-normal text-mehendi">The dye pot palette.</h2>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-2">
              {colourGroups.map(({ colour, product, count }) => (
                <Link key={colour} href={productHref(product)} className="group flex shrink-0 flex-col items-center gap-3">
                  <span className="relative block size-24 overflow-hidden rounded-full border-4 border-white shadow-[0_10px_30px_rgba(34,56,35,0.15)] transition duration-300 group-hover:scale-105 sm:size-28">
                    <Image src={product.photo!} alt={colour} fill sizes="112px" className="object-cover object-[center_18%]" />
                  </span>
                  <span className="text-center">
                    <span className="block text-xs font-black uppercase tracking-[0.1em] text-mehendi">{colour}</span>
                    <span className="block text-[11px] text-mehendi/55">{count} {count === 1 ? "piece" : "pieces"}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* The ties you'll find — a real craft glossary */}
      <section className="relative mx-auto max-w-[1500px] px-4 py-16 sm:px-6 lg:px-10">
        <MotifField variant="c" tone="text-neem" />
        <div className="relative mb-10 border-b border-black/10 pb-6">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-gulal">The Bandhej glossary</p>
          <h2 className="mt-2 font-display text-5xl font-bold tracking-normal">The ties you&rsquo;ll find.</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-black/62">
            Every piece in this catalog is named for the way it was actually tied. Here are the four patterns behind them.
          </p>
        </div>
        <div className="relative grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {techniqueExamples.map(({ technique, example }) => (
            <article key={technique.id} className="glass-card flex flex-col overflow-hidden rounded-[22px]">
              {example?.photo && (
                <div className="relative m-3 aspect-[4/3] overflow-hidden rounded-[16px]">
                  <Image src={example.photo} alt={technique.term} fill sizes="280px" className="object-cover object-[center_15%]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                  <span className="absolute bottom-2 left-3 font-display text-xl font-bold text-[#fffdf1]">{technique.term}</span>
                </div>
              )}
              <div className="flex flex-1 flex-col p-5 pt-2">
                <h3 className="text-sm font-black uppercase tracking-[0.16em] text-neem">{technique.title}</h3>
                <p className="mt-2 text-sm leading-6 text-black/62">{technique.copy}</p>
                {example && (
                  <Link href={productHref(example)} className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-black uppercase tracking-[0.14em] text-sindoor">
                    See it on {example.name} <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="pb-8">
        <StitchDivider tone="text-neem/40" className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10" />
      </div>

      <BottomNav count={activeProducts.length} />
    </main>
  );
}
