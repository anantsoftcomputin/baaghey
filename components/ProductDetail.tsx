"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Check, Heart, X } from "lucide-react";
import { bandhaniTechniques, type Product } from "@/lib/products";
import { formatPrice, productHref, productPhotos } from "@/lib/catalog";
import { SHIPS_IN } from "@/lib/site";
import { useCommerce } from "@/components/CommerceProvider";
import { Diamond } from "@/components/Wordmark";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

const PROMISES = ["Hand-tied in Gujarat", "Natural fabrics", "7-day returns", "Secure payments"];

/** Body measurements in inches. Verify against your patterns before launch. */
const SIZE_CHART = [
  ["XS", "32–34", "26–28"],
  ["S", "34–36", "28–30"],
  ["M", "36–38", "30–32"],
  ["L", "38–40", "32–34"],
  ["XL", "40–42", "34–36"],
  ["XXL", "42–44", "36–38"],
];

function stockFor(product: Product, size: string) {
  return product.sizeInventory?.[size] ?? product.inventory;
}

export function ProductDetail({
  product,
  related = [],
  variant,
  titleId,
}: {
  product: Product;
  related?: Product[];
  variant: "modal" | "page";
  titleId?: string;
}) {
  const { addToCart, toggleWishlist, isWishlisted, openBag } = useCommerce();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const photoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [size, setSize] = useState("");
  const [added, setAdded] = useState(false);
  const [active, setActive] = useState(0);
  const [chartOpen, setChartOpen] = useState(false);
  const [hint, setHint] = useState(false);
  /** Phones: a buy bar appears whenever the main add button is off screen. */
  const [barVisible, setBarVisible] = useState(false);
  const photos = productPhotos(product);
  const wished = isWishlisted(product.id);
  const stock = size ? stockFor(product, size) : 0;
  const technique = bandhaniTechniques.find((item) => item.exampleIds.includes(product.id));
  const soldOut = product.sizes.every((item) => stockFor(product, item) <= 0);

  useEffect(() => {
    // Never pick a size for the shopper, except when there is only one.
    setSize(product.sizes.length === 1 && stockFor(product, product.sizes[0]) > 0 ? product.sizes[0] : "");
    setHint(false);
    setActive(0);
    setAdded(false);
  }, [product]);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.fromTo("[data-pd-item]", { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.05, delay: variant === "modal" ? 0.3 : 0.1 });
      gsap.from("[data-pd-photo]", { clipPath: "inset(0 0 100% 0)", duration: 1.2, ease: "expo.inOut", stagger: 0.12, delay: variant === "modal" ? 0.15 : 0 });
    });
    return () => mm.revert();
  }, { scope: root, dependencies: [product.id], revertOnUpdate: true });

  useEffect(() => {
    const target = button.current;
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setBarVisible(!entry.isIntersecting), { threshold: 0 });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  function addToBag() {
    if (!size) {
      setHint(true);
      const first = root.current?.querySelector<HTMLButtonElement>('[role="radio"]:not([disabled])');
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      first?.focus({ preventScroll: true });
      return;
    }
    if (stock <= 0) return;
    addToCart(product, size);
    setAdded(true);
    if (button.current && window.matchMedia(MOTION_OK).matches) gsap.fromTo(button.current, { scale: 0.97 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.5)" });
    window.setTimeout(openBag, 500);
    window.setTimeout(() => setAdded(false), 2400);
  }

  function showPhoto(index: number) {
    setActive(index);
    photoRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  return (
    <div ref={root}>
      <div className={`grid gap-8 lg:grid-cols-[64px_minmax(0,1.05fr)_minmax(0,0.9fr)] lg:gap-10 ${variant === "modal" ? "lg:pr-10" : ""}`}>
        {/* Thumbnail rail */}
        <div className="hidden lg:block">
          <div className="sticky top-6 grid gap-2">
            {photos.map((photo, index) => (
              <button key={`${index}-${photo.slice(-12)}`} aria-label={`Show image ${index + 1}`} onClick={() => showPhoto(index)}
                className={`relative aspect-[3/4] overflow-hidden bg-cream transition-opacity ${active === index ? "ring-1 ring-ink" : "opacity-60 hover:opacity-100"}`}>
                <Image src={photo} alt="" fill sizes="64px" unoptimized={photo.startsWith("data:")} className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Photos: swipe on phones, stacked on desktop */}
        <div className="relative">
          <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto lg:grid lg:gap-3 lg:overflow-visible"
            onScroll={(event) => { const el = event.currentTarget; if (el.scrollWidth > el.clientWidth) setActive(Math.round(el.scrollLeft / el.clientWidth)); }}>
            {(photos.length ? photos : [""]).map((photo, index) => (
              <div key={`${index}-${photo.slice(-16)}`} ref={(el) => { photoRefs.current[index] = el; }} data-pd-photo className="cursor-motif relative aspect-[3/4] w-full shrink-0 snap-center overflow-hidden bg-cream">
                {photo ? (
                  <Image src={photo} alt={index === 0 ? product.name : `${product.name}, view ${index + 1}`} fill priority={index === 0} sizes="(max-width: 1024px) 100vw, 45vw" unoptimized={photo.startsWith("data:")} className="object-cover object-[center_20%]" />
                ) : <div className="absolute inset-0" style={{ background: product.image }} />}
              </div>
            ))}
          </div>
          {photos.length > 1 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5 lg:hidden">
              {photos.map((_, index) => <span key={index} className={`h-1 transition-all duration-500 ${active === index ? "w-6 bg-white" : "w-2 bg-white/60"}`} />)}
            </div>
          )}
        </div>

        {/* Details */}
        <div className={variant === "modal" ? "px-5 pb-10 lg:px-0 lg:pt-14" : "lg:pt-2"}>
          <div className="lg:sticky lg:top-28">
            <div data-pd-item className="flex items-start justify-between gap-4">
              <div>
                <h1 id={titleId} className="text-[18px] font-semibold uppercase tracking-[0.12em]">{product.name}</h1>
                <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-mute">Hand-tied{technique ? ` · ${technique.term}` : ""}</p>
              </div>
              <button aria-label={wished ? "Remove from wishlist" : "Add to wishlist"} aria-pressed={wished} onClick={() => toggleWishlist(product.id)} className={`grid size-9 shrink-0 place-items-center ${wished ? "text-pink-dark" : "text-ink hover:text-pink-dark"}`}>
                <Heart size={18} strokeWidth={1.6} fill={wished ? "currentColor" : "none"} />
              </button>
            </div>
            <p data-pd-item className="mt-4 text-[14px] tracking-[0.04em]">
              {product.salePrice ? <><span className="text-pink-dark">{formatPrice(product.salePrice)}</span> <span className="ml-2 text-mute line-through">{formatPrice(product.price)}</span></> : formatPrice(product.price)}
              <span className="ml-2 text-[11px] text-mute">incl. taxes</span>
            </p>

            <div data-pd-item className="mt-6 border-t border-line pt-5">
              <div className="flex items-center justify-between">
                <p aria-live="polite" className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${hint && !size ? "text-pink-dark" : ""}`}>{hint && !size ? "Please choose a size" : <>Size <span className="ml-1 font-normal text-mute">{size}</span></>}</p>
                <button className="text-[11px] uppercase tracking-[0.12em] underline underline-offset-4" onClick={() => setChartOpen(true)}>Size chart</button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Choose a size">
                {product.sizes.map((item) => {
                  const left = stockFor(product, item);
                  return (
                    <button key={item} role="radio" aria-checked={size === item} disabled={left <= 0} onClick={() => { setSize(item); setHint(false); }}
                      className={`h-9 min-w-11 border px-3 text-[11px] font-semibold transition-colors ${size === item ? "border-ink bg-ink text-white" : "border-line hover:border-ink"} ${left <= 0 ? "line-through" : ""}`}>
                      {item}
                    </button>
                  );
                })}
              </div>
              {stock > 0 && stock <= product.lowStockAt && <p className="mt-2 text-[11px] text-accent">Only {stock} left in {size}</p>}
            </div>

            <button data-pd-item ref={button} className="btn btn-primary mt-6 h-12 w-full" disabled={soldOut || Boolean(size && stock <= 0)} onClick={addToBag}>
              {soldOut ? "Sold out" : added ? <><Check size={15} /> Added to cart</> : size ? "Add to cart" : "Select a size"}
            </button>
            <p data-pd-item className="mt-4 text-center text-[11px] font-semibold uppercase tracking-[0.16em]">Ships in : {SHIPS_IN}</p>

            <ul data-pd-item className="mt-7 grid grid-cols-4 gap-2 text-center">
              {PROMISES.map((promise) => (
                <li key={promise} className="flex flex-col items-center gap-2">
                  <span className="relative size-8"><Diamond className="inset-0 size-8" /></span>
                  <span className="text-[9.5px] uppercase leading-tight tracking-[0.08em] text-mute">{promise}</span>
                </li>
              ))}
            </ul>

            <div data-pd-item className="mt-7 border-t border-line">
              <Accordion title="Description" open>{product.description ?? product.craft}</Accordion>
              <Accordion title="Product details">{product.details ?? product.craft}{technique && <><br /><br /><strong className="font-semibold text-ink">{technique.term}</strong> — {technique.copy}</>}<br /><br />Colour: {product.color} · Fabric: {product.material} · SKU {product.sku}</Accordion>
              <Accordion title="Product care">{product.care ?? "Dry clean or hand wash cold. Dry in shade to keep the dye bright."}</Accordion>
              <Accordion title="Shipping & returns">Every piece is tied and dyed in small batches and ships in {SHIPS_IN}. Free shipping across India on orders over ₹3,000. Returns and exchanges are accepted within 7 days of delivery on unworn pieces with tags attached. <Link href="/refund-policy" className="underline underline-offset-2">Read the full policy</Link>.</Accordion>
            </div>

            {variant === "modal" && (
              // A plain anchor so the full page loads instead of reopening this pop-up.
              <a data-pd-item href={productHref(product)} className="text-link mt-6">View full details</a>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className={`mt-20 ${variant === "modal" ? "px-5 pb-12 lg:px-10" : ""}`}>
          <p className="label">Related products</p>
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-x-5">
            {related.slice(0, 4).map((item) => <RelatedCard key={item.id} product={item} replace={variant === "modal"} />)}
          </div>
        </section>
      )}

      {chartOpen && <SizeChart onClose={() => setChartOpen(false)} />}

      {!soldOut && (
        <div aria-hidden={!barVisible}
          className={`${variant === "modal" ? "sticky" : "fixed inset-x-0"} bottom-0 z-30 border-t border-line bg-white/95 px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-xl transition-[transform,opacity] duration-500 ease-silk lg:hidden ${barVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"}`}>
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.1em]">{product.name}</p>
              <p className="text-[13px]">{product.salePrice ? <><span className="text-pink-dark">{formatPrice(product.salePrice)}</span> <span className="ml-1 text-[11px] text-mute line-through">{formatPrice(product.price)}</span></> : formatPrice(product.price)}{size && <span className="ml-2 text-[11px] text-mute">Size {size}</span>}</p>
            </div>
            <button tabIndex={barVisible ? 0 : -1} onClick={addToBag} disabled={Boolean(size && stock <= 0)} className="btn btn-primary h-11 shrink-0 rounded-full px-6">
              {added ? <><Check size={15} /> Added</> : size ? "Add to cart" : "Select size"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RelatedCard({ product, replace }: { product: Product; replace: boolean }) {
  const photo = productPhotos(product)[0];
  return (
    <Link href={productHref(product)} scroll={false} replace={replace} className="group block">
      <div className="cursor-motif relative aspect-[3/4] overflow-hidden bg-cream">
        {photo && <Image src={photo} alt={product.name} fill sizes="(max-width: 1024px) 50vw, 25vw" unoptimized={photo.startsWith("data:")} className="object-cover object-[center_20%] transition-transform duration-1000 ease-silk group-hover:scale-[1.04]" />}
      </div>
      <div className="flex justify-between gap-3 pt-3 text-[11px] uppercase tracking-[0.1em]">
        <span className="font-semibold">{product.name}</span>
        <span className="shrink-0 text-mute">{formatPrice(product.salePrice ?? product.price)}</span>
      </div>
    </Link>
  );
}

function Accordion({ title, children, open = false }: { title: string; children: ReactNode; open?: boolean }) {
  const [isOpen, setOpen] = useState(open);
  const body = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (!body.current) return;
    gsap.to(body.current, { height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0, duration: 0.5, ease: "expo.out" });
  }, { dependencies: [isOpen] });
  return (
    <div className="border-b border-line">
      <button className="flex w-full items-center justify-between py-4 text-left text-[11px] font-semibold uppercase tracking-[0.14em]" aria-expanded={isOpen} onClick={() => setOpen(!isOpen)}>
        {title}
        <ChevronDown size={14} className={`transition-transform duration-500 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <div ref={body} className="overflow-hidden" style={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}>
        <div className="pb-5 text-[12.5px] leading-6 text-ink/75">{children}</div>
      </div>
    </div>
  );
}

function SizeChart({ onClose }: { onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (window.matchMedia(MOTION_OK).matches) gsap.from(panel.current, { y: 30, autoAlpha: 0, duration: 0.5, ease: "expo.out" });
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { event.stopImmediatePropagation(); onClose(); } };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[85] grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div ref={panel} role="dialog" aria-modal="true" aria-label="Size chart" className="w-full max-w-md bg-white p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="label">Size chart</p>
          <button onClick={onClose} aria-label="Close size chart" className="grid size-8 place-items-center"><X size={16} /></button>
        </div>
        <table className="mt-5 w-full text-left text-[12px]">
          <thead><tr className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-mute"><th className="py-2 font-semibold">Size</th><th className="font-semibold">Chest (in)</th><th className="font-semibold">Waist (in)</th></tr></thead>
          <tbody>{SIZE_CHART.map(([label, chest, waist]) => <tr key={label} className="border-b border-line"><td className="py-2.5 font-semibold">{label}</td><td>{chest}</td><td>{waist}</td></tr>)}</tbody>
        </table>
        <p className="mt-4 text-[11px] leading-5 text-mute">Body measurements. Our cuts are relaxed — between sizes, choose the smaller for a closer fit. Write to us for custom sizing.</p>
      </div>
    </div>
  );
}
