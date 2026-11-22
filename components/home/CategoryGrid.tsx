"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import type { Category, Product } from "@/lib/products";
import { productPhoto } from "@/lib/catalog";
import { Reveal } from "@/components/motion/Reveal";

type Tile = { key: string; label: string; href: string; photo?: string };

/** Up to six labelled tiles: every category first, then subcategories that
 * have products of their own. A tile only ever shows a photo of its own
 * pieces, never a borrowed one from another category. */
function buildTiles(categories: Category[], products: Product[]): Tile[] {
  const used = new Set<string>();
  const pick = (candidates: Product[]) => {
    const photos = candidates.map((product) => productPhoto(product)).filter(Boolean) as string[];
    const fresh = photos.find((photo) => !used.has(photo)) ?? photos[0];
    if (fresh) used.add(fresh);
    return fresh;
  };
  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
  const tiles: Tile[] = sorted.map((category) => ({
    key: category.id,
    label: category.name,
    href: `/shop?category=${category.id}`,
    photo: category.coverPhoto ?? pick(products.filter((product) => product.category === category.id)),
  }));
  for (const category of sorted) {
    for (const sub of category.subcategories ?? []) {
      if (tiles.length >= 6) break;
      const photo = pick(products.filter((product) => product.category === category.id && product.subcategory === sub.id));
      if (photo) tiles.push({ key: `${category.id}-${sub.id}`, label: sub.name, href: `/shop?category=${category.id}&subcategory=${sub.id}`, photo });
    }
  }
  return tiles.slice(0, 6);
}

export function CategoryGrid({ categories, products }: { categories: Category[]; products: Product[] }) {
  const tiles = useMemo(() => buildTiles(categories, products), [categories, products]);
  return (
    <section id="collections" className="container-max gutter pb-20 lg:pb-28">
      <Reveal as="h2" className="section-title">Category</Reveal>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
        {tiles.map((tile, index) => (
          <Reveal key={tile.key} variant="image" delay={(index % 3) * 0.08} className={index === tiles.length - 1 && tiles.length % 2 ? "col-span-2 md:col-span-1" : ""}>
            <Link href={tile.href} className={`group relative block overflow-hidden bg-cream ${index === tiles.length - 1 && tiles.length % 2 ? "aspect-[8/5] md:aspect-[4/5]" : "aspect-[4/5]"}`}>
              {tile.photo && <Image src={tile.photo} alt="" fill sizes="(max-width: 768px) 50vw, 33vw" unoptimized={tile.photo.startsWith("data:")} className="object-cover object-[center_22%] transition-transform duration-[1.4s] ease-silk group-hover:scale-[1.06]" />}
              <span className="absolute inset-0 bg-black/10 transition-colors duration-500 group-hover:bg-black/25" />
              <span className="absolute inset-0 grid place-items-center">
                <span className="text-center text-[13px] font-bold uppercase tracking-[0.2em] text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)] sm:text-[15px]">
                  {tile.label}
                  <span className="mx-auto mt-1.5 block h-px w-0 bg-white transition-all duration-500 ease-silk group-hover:w-full" />
                </span>
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
