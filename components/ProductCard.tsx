"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import type { Product } from "@/lib/products";
import { formatPrice, productHref } from "@/lib/catalog";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="glass-card group rounded-[24px] transition duration-300 hover:-translate-y-1">
      <Link
        href={productHref(product)}
        className="relative m-3 block aspect-[4/5] overflow-hidden rounded-[20px] bg-mehendi/10"
      >
        {product.photo ? (
          <Image
            src={product.photo}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 1280px) 45vw, 360px"
            className="object-cover object-[center_18%] transition duration-500 group-hover:scale-[1.05]"
          />
        ) : product.imageDataUrl ? (
          <div className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.05]" style={{ backgroundImage: `url(${product.imageDataUrl})` }} />
        ) : (
          <div className="absolute inset-0" style={{ background: product.image }}>
            <div className="bandhani-weave absolute inset-0" />
          </div>
        )}

        {/* soft edge vignette so text and badges stay legible over any photo */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

        {product.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-kesar/95 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-ink shadow-sm backdrop-blur">
            Featured
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-black/45 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#fffdf1] backdrop-blur">
          {product.color}
        </span>

        <span className="absolute bottom-3 left-3 right-3 flex translate-y-16 items-center justify-between rounded-full bg-ink/85 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-kesar opacity-0 backdrop-blur-xl transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          View product <ArrowRight size={17} />
        </span>
      </Link>
      <div className="m-3 mt-0 rounded-[20px] border border-white/35 bg-white/25 p-5 pt-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-2xl">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-neem">{product.material}</p>
          <button aria-label="Add to wishlist" className="grid size-9 place-items-center rounded-full border border-white/45 bg-white/35 text-gulal backdrop-blur-xl">
            <Heart size={16} />
          </button>
        </div>
        <Link href={productHref(product)}>
          <h3 className="mt-3 font-display text-3xl font-bold tracking-normal">{product.name}</h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-black/60">{product.craft}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="font-black">
            {product.salePrice ? (
              <>
                {formatPrice(product.salePrice)}
                <span className="ml-2 text-xs text-black/40 line-through">{formatPrice(product.price)}</span>
              </>
            ) : (
              formatPrice(product.price)
            )}
          </p>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-black/42">{product.inventory > 0 ? `${product.inventory} left` : "Sold out"}</p>
        </div>
      </div>
    </article>
  );
}
