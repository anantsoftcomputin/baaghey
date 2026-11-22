"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCommerce } from "@/components/CommerceProvider";
import { useCatalog } from "@/hooks/useCatalog";
import { formatPrice, productHref, productPhotos } from "@/lib/catalog";
import { SHIPS_IN } from "@/lib/site";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

function stockFor(sizeInventory: Record<string, number> | undefined, inventory: number, size: string) {
  return sizeInventory?.[size] ?? inventory;
}

/** Compact product pop-up for adding to the cart without leaving the page.
 * Mounted once in the root layout and driven by `openQuickView`. */
export function QuickView() {
  const { quickViewId } = useCommerce();
  if (!quickViewId) return null;
  return <QuickViewDialog key={quickViewId} productId={quickViewId} />;
}

function QuickViewDialog({ productId }: { productId: string }) {
  const { closeQuickView, addToCart, openBag } = useCommerce();
  const { activeProducts } = useCatalog();
  const product = useMemo(() => activeProducts.find((item) => item.id === productId), [activeProducts, productId]);
  const overlay = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const [size, setSize] = useState("");
  const [photo, setPhoto] = useState(0);
  const [added, setAdded] = useState(false);
  const [hint, setHint] = useState(false);

  const photos = product ? productPhotos(product) : [];
  const soldOut = product ? product.sizes.every((item) => stockFor(product.sizeInventory, product.inventory, item) <= 0) : false;
  const singleSize = product?.sizes.length === 1 ? product.sizes[0] : "";
  const chosen = size || singleSize;

  useGSAP(() => {
    const animate = window.matchMedia(MOTION_OK).matches;
    const desktop = window.matchMedia("(min-width: 768px)").matches;
    gsap.fromTo(overlay.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: animate ? 0.35 : 0 });
    gsap.fromTo(panel.current, desktop ? { y: 30, autoAlpha: 0, scale: 0.98 } : { yPercent: 100 }, { y: 0, yPercent: 0, autoAlpha: 1, scale: 1, duration: animate ? 0.7 : 0, ease: "expo.out" });
  });

  const close = useCallback((then?: () => void) => {
    if (closing.current) return;
    closing.current = true;
    const animate = window.matchMedia(MOTION_OK).matches;
    gsap.to(overlay.current, { autoAlpha: 0, duration: animate ? 0.3 : 0 });
    gsap.to(panel.current, { autoAlpha: 0, y: 20, duration: animate ? 0.3 : 0, ease: "power2.in", onComplete: () => { closeQuickView(); then?.(); } });
  }, [closeQuickView]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus({ preventScroll: true });
    // Capture phase so Escape closes only this pop-up when it sits over another.
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.stopImmediatePropagation(); close(); return; }
      if (event.key !== "Tab" || !panel.current) return;
      const focusable = panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      // The product pop-up underneath, if open, keeps its own scroll lock.
      if (!document.querySelector('[aria-labelledby="product-modal-title"]')) document.body.style.overflow = "";
      previous?.focus?.({ preventScroll: true });
    };
  }, [close]);

  function add() {
    if (!product) return;
    if (!chosen) {
      setHint(true);
      if (window.matchMedia(MOTION_OK).matches) gsap.fromTo("[data-qv-sizes]", { x: -6 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
      return;
    }
    addToCart(product, chosen);
    setAdded(true);
    window.setTimeout(() => close(openBag), 650);
  }

  const step = (delta: number) => setPhoto((current) => (current + delta + photos.length) % photos.length);

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center md:items-center md:p-6">
      <div ref={overlay} className="absolute inset-0 bg-ink/45" onClick={() => close()} style={{ visibility: "hidden" }} />
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby="quick-view-title" style={{ visibility: "hidden" }}
        className="relative grid max-h-[92svh] w-full overflow-y-auto overscroll-contain rounded-t-[24px] bg-white md:max-w-[880px] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:rounded-none">
        <span aria-hidden="true" className="absolute left-1/2 top-2 z-10 h-1 w-10 -translate-x-1/2 rounded-full bg-white/80 shadow md:hidden" />
        <button ref={closeButton} onClick={() => close()} aria-label="Close quick view" className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-full bg-white/90 shadow-sm transition-transform duration-500 ease-silk hover:rotate-90 md:right-2 md:top-2 md:rounded-none md:shadow-none">
          <X size={17} />
        </button>

        {product ? (
          <>
            <div className="cursor-motif relative aspect-[4/5] max-h-[42svh] w-full bg-cream md:aspect-[3/4] md:max-h-none">
              {photos[photo] && <Image key={photos[photo]} src={photos[photo]} alt={product.name} fill sizes="(max-width: 768px) 100vw, 440px" unoptimized={photos[photo].startsWith("data:")} className="object-cover object-[center_20%]" />}
              {photos.length > 1 && (
                <>
                  <button onClick={() => step(-1)} aria-label="Previous image" className="absolute left-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center bg-white/85"><ChevronLeft size={16} /></button>
                  <button onClick={() => step(1)} aria-label="Next image" className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center bg-white/85"><ChevronRight size={16} /></button>
                  <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                    {photos.map((_, index) => <span key={index} className={`h-1 transition-all duration-500 ${photo === index ? "w-6 bg-white" : "w-2 bg-white/60"}`} />)}
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col px-5 pt-5 sm:px-8 sm:pt-8 md:pb-8">
              <h2 id="quick-view-title" className="pr-10 text-[16px] font-semibold uppercase tracking-[0.12em]">{product.name}</h2>
              <p className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-mute">{product.color} · {product.material}</p>
              <p className="mt-4 text-[14px]">
                {product.salePrice ? <><span className="text-pink-dark">{formatPrice(product.salePrice)}</span> <span className="ml-2 text-mute line-through">{formatPrice(product.price)}</span></> : formatPrice(product.price)}
              </p>
              <p className="mt-4 line-clamp-3 text-[12.5px] leading-6 text-ink/70">{product.description ?? product.craft}</p>

              <div className="mt-6 border-t border-line pt-5">
                <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${hint && !chosen ? "text-pink-dark" : ""}`}>
                  {hint && !chosen ? "Please choose a size" : <>Size <span className="ml-1 font-normal text-mute">{chosen}</span></>}
                </p>
                <div data-qv-sizes className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Choose a size">
                  {product.sizes.map((item) => {
                    const left = stockFor(product.sizeInventory, product.inventory, item);
                    return (
                      <button key={item} role="radio" aria-checked={chosen === item} disabled={left <= 0} onClick={() => { setSize(item); setHint(false); }}
                        className={`h-9 min-w-11 border px-3 text-[11px] font-semibold transition-colors ${chosen === item ? "border-ink bg-ink text-white" : "border-line hover:border-ink"} ${left <= 0 ? "line-through" : ""}`}>
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* A plain anchor: the full page, not another pop-up. */}
              <a href={productHref(product)} className="text-link mt-5 self-start md:order-last md:mt-auto md:pt-6">View full details</a>
              {/* Pinned to the bottom of the sheet on phones so it is always reachable. */}
              <div className="sticky bottom-0 -mx-5 mt-5 border-t border-line bg-white/95 px-5 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:-mx-8 sm:px-8 md:static md:mx-0 md:mt-6 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
                <button className="btn btn-primary h-12 w-full" disabled={soldOut || added} onClick={add}>
                  {soldOut ? "Sold out" : added ? <><Check size={15} /> Added to cart</> : chosen ? `Add to cart · ${formatPrice(product.salePrice ?? product.price)}` : "Select a size"}
                </button>
                <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-mute">Ships in : {SHIPS_IN}</p>
              </div>
            </div>
          </>
        ) : (
          <p className="p-10 text-[12px] uppercase tracking-[0.14em] text-mute md:col-span-2">Loading…</p>
        )}
      </div>
    </div>
  );
}
