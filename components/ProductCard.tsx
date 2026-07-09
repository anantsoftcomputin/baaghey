"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/products";
import { formatPrice, productHref } from "@/lib/catalog";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group">
      <Link href={productHref(product)} className="relative block aspect-[4/5] overflow-hidden bg-[#f4f4f4]">
        {product.photo ? (
          <Image
            src={product.photo}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 320px"
            className="object-cover object-[center_18%] transition duration-300 group-hover:scale-[1.03]"
          />
        ) : product.imageDataUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-[1.03]"
            style={{ backgroundImage: `url(${product.imageDataUrl})` }}
          />
        ) : (
          <div className="absolute inset-0" style={{ background: product.image }} />
        )}

        {product.salePrice && (
          <span className="absolute left-2 top-2 bg-pink px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
            Sale
          </span>
        )}
        {product.featured && !product.salePrice && (
          <span className="absolute left-2 top-2 bg-yellow px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-ink">
            Featured
          </span>
        )}
        <button
          aria-label="Add to wishlist"
          className="absolute right-2 top-2 grid size-8 place-items-center bg-white/90 text-green-dark"
          onClick={(event) => event.preventDefault()}
        >
          <Heart size={15} />
        </button>
      </Link>
      <div className="pt-3">
        <p className="text-[11px] uppercase tracking-[0.08em] text-faint">{product.material}</p>
        <Link href={productHref(product)}>
          <h3 className="mt-1 text-sm font-semibold leading-snug">{product.name}</h3>
        </Link>
        <div className="mt-1.5 flex items-center gap-2 text-sm">
          {product.salePrice ? (
            <>
              <span className="font-bold text-pink-dark">{formatPrice(product.salePrice)}</span>
              <span className="text-faint line-through">{formatPrice(product.price)}</span>
            </>
          ) : (
            <span className="font-bold">{formatPrice(product.price)}</span>
          )}
        </div>
        {product.inventory <= 0 && <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-mute">Sold out</p>}
      </div>
    </article>
  );
}
