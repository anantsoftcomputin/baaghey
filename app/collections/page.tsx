"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { StoreHeader } from "@/components/StoreHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/motion/Reveal";
import { categoryMedia, formatPrice, productHref, productPhoto } from "@/lib/catalog";
import { bandhaniTechniques } from "@/lib/products";
import { useCatalog } from "@/hooks/useCatalog";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export default function CollectionsPage() {
  const reduceMotion = useReducedMotion();
  const { activeProducts, categories } = useCatalog();

  const rows = useMemo(() => [...categories].sort((a, b) => a.sortOrder - b.sortOrder).map((category) => {
    const items = activeProducts.filter((product) => product.category === category.id);
    const prices = items.map((product) => product.salePrice ?? product.price);
    const cover = items.find((product) => product.featured && productPhoto(product)) ?? items.find((product) => productPhoto(product));
    const poster = cover && productPhoto(cover);
    return {
      category,
      count: items.length,
      range: prices.length ? [Math.min(...prices), Math.max(...prices)] : null,
      media: categoryMedia(category, poster),
      poster,
      subs: (category.subcategories ?? []).map((sub) => ({ sub, count: items.filter((product) => product.subcategory === sub.id).length })),
    };
  }), [categories, activeProducts]);

  const palette = useMemo(() => {
    const byColour = new Map<string, { product: (typeof activeProducts)[number]; count: number }>();
    for (const product of activeProducts) {
      if (!productPhoto(product)) continue;
      const entry = byColour.get(product.color);
      if (entry) entry.count += 1;
      else byColour.set(product.color, { product, count: 1 });
    }
    return Array.from(byColour, ([colour, entry]) => ({ colour, ...entry }));
  }, [activeProducts]);

  const glossary = useMemo(() => bandhaniTechniques.map((technique) => ({
    technique,
    example: activeProducts.find((product) => technique.exampleIds.includes(product.id) && productPhoto(product)),
  })), [activeProducts]);

  return (
    <main className="min-h-screen overflow-x-clip">
      <StoreHeader />

      <section className="container-max gutter relative pb-16 pt-[124px]">
        <Reveal as="p" className="eyebrow text-mute">{activeProducts.length} pieces · {rows.length} silhouettes</Reveal>
        <Reveal as="h1" variant="lines" className="page-title relative mt-4">Collections</Reveal>
        <Reveal as="p" className="relative mt-5 max-w-lg text-[15px] leading-7 text-ink/70">Browse by silhouette, by the colour of the dye pot, or by the way each cloth was tied.</Reveal>
      </section>

      <section className="container-max gutter grid gap-24 pb-28 sm:gap-32">
        {rows.map(({ category, count, range, media, poster, subs }, index) => (
          <article key={category.id} className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            <Link href={`/shop?category=${category.id}`} aria-label={`Shop ${category.name}`} className={`group block ${index % 2 ? "md:order-2" : ""}`}>
              <Reveal variant="image" className="frame relative aspect-[4/5] bg-cream">
                {media?.type === "video" ? (
                  <video className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-silk group-hover:scale-105" src={media.src} autoPlay={!reduceMotion} muted loop playsInline preload="metadata" poster={poster && !poster.startsWith("data:") ? poster : undefined} />
                ) : media?.type === "photo" ? (
                  <Image src={media.src} alt="" fill sizes="(max-width: 768px) 90vw, 45vw" unoptimized={media.src.startsWith("data:")} className="object-cover object-[center_20%] transition-transform duration-[1.4s] ease-silk group-hover:scale-105" />
                ) : null}
              </Reveal>
            </Link>
            <div>
              <Reveal as="p" className="text-pink-dark text-[15px] font-semibold uppercase tracking-[0.1em] text-[20px] font-light">0{index + 1}</Reveal>
              <Reveal as="h2" variant="lines" className="mt-3 text-[22px] font-semibold uppercase tracking-[0.1em]">{category.name}</Reveal>
              <Reveal as="p" className="mt-5 max-w-md text-[16px] leading-7 text-ink/70">{category.description}</Reveal>
              <Reveal className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <span><span className="text-mute">Pieces</span> · {count}</span>
                {range && <span><span className="text-mute">From</span> · {formatPrice(range[0])}{range[1] !== range[0] ? ` to ${formatPrice(range[1])}` : ""}</span>}
              </Reveal>
              {subs.length > 0 && (
                <Reveal className="mt-6 flex flex-wrap gap-2">
                  {subs.map(({ sub, count: subCount }) => (
                    <Link key={sub.id} href={`/shop?category=${category.id}&subcategory=${sub.id}`} className="chip">{sub.name}{subCount ? <span className="text-mute">{subCount}</span> : null}</Link>
                  ))}
                </Reveal>
              )}
              <Reveal><Link href={`/shop?category=${category.id}`} className="btn btn-primary mt-9">Shop {category.name} <ArrowUpRight size={15} /></Link></Reveal>
            </div>
          </article>
        ))}
      </section>

      {palette.length > 0 && (
        <section className="bg-paper py-24">
          <div className="container-max gutter">
            <Reveal as="p" className="eyebrow text-mute">Shop by colour</Reveal>
            <Reveal as="h2" variant="lines" className="mt-4 text-[22px] font-semibold uppercase tracking-[0.1em]">The dye-pot palette.</Reveal>
          </div>
          <div className="relative mt-12">
          {/* Fades hint that the row scrolls sideways when it overflows. */}
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-paper to-transparent" />
          <div className="no-scrollbar flex snap-x gap-6 overflow-x-auto px-4 pr-16 sm:gap-10 sm:px-6 sm:pr-16 lg:px-12 lg:pr-20">
            {palette.map(({ colour, product, count }, index) => (
              <Reveal key={colour} delay={index * 0.05} className="shrink-0 snap-start">
                <Link href={productHref(product)} scroll={false} className="group flex flex-col items-center gap-4">
                  <span className="relative block size-32 overflow-hidden rounded-full ring-1 ring-ink/10 transition-transform duration-700 ease-silk group-hover:-translate-y-2 sm:size-40">
                    <Image src={productPhoto(product)!} alt="" fill sizes="160px" unoptimized={productPhoto(product)!.startsWith("data:")} className="object-cover object-[center_32%] transition-transform duration-[1.2s] ease-silk group-hover:scale-125" />
                  </span>
                  <span className="text-center">
                    <span className="block text-[15px] font-semibold uppercase tracking-[0.1em]">{colour}</span>
                    <span className="text-xs text-mute">{count} {count === 1 ? "piece" : "pieces"}</span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
          </div>
        </section>
      )}

      <section className="container-max gutter py-28">
        <Reveal as="p" className="eyebrow text-mute">The Bandhej glossary</Reveal>
        <Reveal as="h2" variant="lines" className="mt-4 max-w-3xl text-[22px] font-semibold uppercase tracking-[0.1em]">Every piece is named for the way it was tied.</Reveal>
        <div className="mt-14 grid gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-4">
          {glossary.map(({ technique, example }, index) => (
            <Reveal key={technique.id} delay={index * 0.08}>
              <div className="frame relative aspect-[4/5] bg-cream">
                {example && <Image src={productPhoto(example)!} alt="" fill sizes="(max-width: 640px) 90vw, 25vw" unoptimized={productPhoto(example)!.startsWith("data:")} className="object-cover object-[center_30%]" />}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
                <p className="absolute bottom-5 left-5 text-paper text-[17px] font-semibold uppercase tracking-[0.1em]">{technique.term}</p>
              </div>
              <p className="eyebrow mt-5 text-ink/60">{technique.title}</p>
              <p className="mt-3 text-[15px] leading-7 text-ink/70">{technique.copy}</p>
              {example && <Link href={productHref(example)} scroll={false} className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.16em] link-underline">See it on {example.name} <ArrowUpRight size={13} /></Link>}
            </Reveal>
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
