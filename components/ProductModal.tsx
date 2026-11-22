"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { ProductDetail } from "@/components/ProductDetail";
import { Diamond } from "@/components/Wordmark";
import { useCatalog } from "@/hooks/useCatalog";
import { productSlug } from "@/lib/catalog";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

/** The product page as a pop-up over whatever the shopper was browsing. It is
 * an intercepted route, so the URL is shareable and a refresh opens the full page. */
export function ProductModal({ slug }: { slug: string }) {
  const router = useRouter();
  const { activeProducts, ready } = useCatalog();
  const overlay = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const closing = useRef(false);

  const product = useMemo(() => activeProducts.find((item) => productSlug(item) === slug || item.id === slug), [activeProducts, slug]);
  const related = useMemo(() => (product ? activeProducts.filter((item) => item.id !== product.id && (item.category === product.category || item.featured)).slice(0, 4) : []), [activeProducts, product]);

  useGSAP(() => {
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    const tl = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
    tl.fromTo(overlay.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: "power2.out" })
      .fromTo(panel.current, desktop ? { xPercent: 100 } : { yPercent: 100 }, { xPercent: 0, yPercent: 0, duration: 0.95 }, 0.05);
    timeline.current = tl;
    if (window.matchMedia(MOTION_OK).matches) tl.play();
    else tl.progress(1);
  });

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const tl = timeline.current;
    if (!tl || !window.matchMedia(MOTION_OK).matches) { router.back(); return; }
    tl.timeScale(1.6).reverse();
    tl.eventCallback("onReverseComplete", () => router.back());
  }, [router]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbar}px`;
    closeButton.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key !== "Tab" || !panel.current) return;
      const focusable = panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      previous?.focus?.({ preventScroll: true });
    };
  }, [close]);

  useEffect(() => { panel.current?.scrollTo({ top: 0 }); }, [slug]);

  return (
    <div className="fixed inset-0 z-[60]">
      <div ref={overlay} className="absolute inset-0 bg-ink/45 backdrop-blur-[3px]" onClick={close} style={{ visibility: "hidden" }} />
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby="product-modal-title"
        className="absolute inset-x-0 bottom-0 top-[5svh] overflow-y-auto overscroll-contain bg-white shadow-[0_-30px_80px_rgba(0,0,0,0.2)] lg:inset-y-0 lg:left-auto lg:right-0 lg:top-0 lg:w-[min(1240px,92vw)]">
        <div className="sticky top-0 z-10 flex h-0 justify-end">
          <button ref={closeButton} onClick={close} aria-label="Close product details" className="m-3 grid size-10 place-items-center bg-white/90 text-ink backdrop-blur transition-transform duration-500 ease-silk hover:rotate-90 lg:m-4">
            <X size={18} />
          </button>
        </div>
        <span className="absolute left-1/2 top-2 z-10 h-1 w-10 -translate-x-1/2 bg-white/80 lg:hidden" aria-hidden="true" />
        {product ? (
          <div className="lg:pl-6 lg:pt-6"><ProductDetail product={product} related={related} variant="modal" titleId="product-modal-title" /></div>
        ) : (
          <div className="grid min-h-[70svh] place-items-center">
            <div className="text-center">
              {!ready && <span className="relative mx-auto block size-10 animate-spin [animation-duration:2.4s]"><Diamond className="inset-0 size-10" /></span>}
              <p id="product-modal-title" className="mt-4 text-sm text-mute">{ready ? "This piece is no longer available." : "Untying the knot…"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
