"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Eye, Heart } from "lucide-react";
import type { Product } from "@/lib/products";
import { formatPrice, productHref, productPhotos } from "@/lib/catalog";
import { useCommerce } from "@/components/CommerceProvider";
import { gsap, MOTION_OK } from "@/lib/gsap";

/** The image and name open the full product pop-up (an intercepted route);
 * "Quick view" opens the compact add-to-cart pop-up in place. */
export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { isWishlisted, toggleWishlist, openQuickView } = useCommerce();
  const heart = useRef<HTMLButtonElement>(null);
  const wished = isWishlisted(product.id);
  const [photo, alternate] = productPhotos(product);
  const soldOut = product.inventory <= 0;
  const price = formatPrice(product.salePrice ?? product.price);

  function toggle() {
    toggleWishlist(product.id);
    if (heart.current && window.matchMedia(MOTION_OK).matches) gsap.fromTo(heart.current, { scale: 0.6 }, { scale: 1, duration: 0.8, ease: "elastic.out(1, 0.35)" });
  }

  return (
    <article className="group relative">
      <div className="relative aspect-[3/4] overflow-hidden bg-cream">
        <Link href={productHref(product)} scroll={false} className="cursor-motif absolute inset-0" aria-label={`${product.name}, ${price}`}>
          {photo ? (
            <>
              <Image src={photo} alt={product.name} fill priority={priority} sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 340px" unoptimized={photo.startsWith("data:")}
                className={`object-cover object-[center_20%] transition-[transform,opacity] duration-[1.2s] ease-silk group-hover:scale-[1.04] ${alternate ? "group-hover:opacity-0" : ""}`} />
              {alternate && <Image src={alternate} alt="" fill sizes="(max-width: 640px) 50vw, 33vw" unoptimized={alternate.startsWith("data:")} className="object-cover object-[center_20%] opacity-0 transition-opacity duration-700 group-hover:opacity-100" />}
            </>
          ) : (
            <div className="absolute inset-0" style={{ background: product.image }} />
          )}
        </Link>
        {(product.salePrice || soldOut) && (
          <span className={`pointer-events-none absolute left-0 top-3 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] ${soldOut ? "bg-white text-ink" : "bg-pink text-white"}`}>{soldOut ? "Sold out" : "Sale"}</span>
        )}
        <button ref={heart} onClick={toggle} aria-label={wished ? `Remove ${product.name} from wishlist` : `Save ${product.name}`} aria-pressed={wished}
          className={`absolute right-2 top-2 grid size-8 place-items-center transition-colors ${wished ? "text-pink-dark" : "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] hover:text-pink"}`}>
          <Heart size={17} strokeWidth={1.6} fill={wished ? "currentColor" : "none"} />
        </button>
        {!soldOut && (
          <>
            {/* Mouse and trackpad: a bar that rises on hover (and on keyboard focus).
              * Chosen by input type, not width, so tablets get the touch button. */}
            <button onClick={() => openQuickView(product.id)} aria-label={`Quick view ${product.name}`}
              className="absolute inset-x-0 bottom-0 hidden translate-y-full bg-white/95 py-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] backdrop-blur transition-transform duration-500 ease-silk hover:bg-green hover:text-white focus-visible:translate-y-0 group-hover:translate-y-0 [@media(hover:hover)_and_(pointer:fine)]:block">
              Quick view
            </button>
            {/* Touch: an always-visible, labelled quick-look pill. */}
            <button onClick={() => openQuickView(product.id)} aria-label={`Quick look at ${product.name}`}
              className="absolute bottom-2 left-2 inline-flex h-8 items-center gap-1.5 rounded-full bg-white/90 pl-2.5 pr-3 text-[10px] font-bold uppercase tracking-[0.12em] text-ink shadow-[0_2px_10px_rgba(0,0,0,0.15)] backdrop-blur active:scale-95 [@media(hover:hover)_and_(pointer:fine)]:hidden">
              <Eye size={14} strokeWidth={1.8} /> Quick look
            </button>
          </>
        )}
      </div>
      <Link href={productHref(product)} scroll={false} tabIndex={-1} className="flex flex-col gap-1 pt-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <h3 className="text-[11px] font-semibold uppercase leading-snug tracking-[0.1em]">{product.name}</h3>
        <p className="shrink-0 text-[12px] tracking-[0.04em] text-ink/70 sm:text-[11px] sm:text-mute">
          {product.salePrice ? <><span className="text-pink-dark">{formatPrice(product.salePrice)}</span> <span className="line-through">{formatPrice(product.price)}</span></> : price}
        </p>
      </Link>
    </article>
  );
}
