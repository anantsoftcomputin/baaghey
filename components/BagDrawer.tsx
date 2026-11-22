"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Minus, Plus, X } from "lucide-react";
import { useCommerce } from "@/components/CommerceProvider";
import { formatPrice } from "@/lib/catalog";
import { FREE_SHIPPING_AT } from "@/lib/commerce";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

const DOTS = 24;

export function BagDrawer() {
  const { bagOpen, closeBag, cart, subtotal, updateQuantity, removeFromCart } = useCommerce();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const overlay = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  const progress = Math.min(1, subtotal / FREE_SHIPPING_AT);
  const filled = Math.round(progress * DOTS);

  useEffect(() => { if (bagOpen) setMounted(true); }, [bagOpen]);
  useEffect(() => { closeBag(); }, [pathname, closeBag]);

  useGSAP(() => {
    if (!mounted || !panel.current) return;
    const animate = window.matchMedia(MOTION_OK).matches;
    if (bagOpen) {
      gsap.fromTo(overlay.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: animate ? 0.45 : 0 });
      gsap.fromTo(panel.current, { xPercent: 100 }, { xPercent: 0, duration: animate ? 0.9 : 0, ease: "expo.out" });
      if (animate) gsap.from(panel.current.querySelectorAll("[data-bag-item]"), { x: 40, autoAlpha: 0, duration: 0.8, stagger: 0.06, delay: 0.2 });
    } else {
      gsap.to(overlay.current, { autoAlpha: 0, duration: animate ? 0.35 : 0 });
      gsap.to(panel.current, { xPercent: 100, duration: animate ? 0.6 : 0, ease: "expo.in", onComplete: () => setMounted(false) });
    }
  }, { dependencies: [bagOpen, mounted] });

  useEffect(() => {
    if (!bagOpen) return;
    // Capture phase, so Escape closes only the bag when it sits over the product pop-up.
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      closeBag();
    };
    document.addEventListener("keydown", onKey, true);
    panel.current?.focus();
    return () => document.removeEventListener("keydown", onKey, true);
  }, [bagOpen, closeBag]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <div ref={overlay} className="absolute inset-0 bg-ink/40" onClick={closeBag} style={{ visibility: "hidden" }} />
      <aside ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Your bag" className="absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col bg-kora outline-none ">
        <header className="flex items-center justify-between px-6 pb-4 pt-6">
          <h2 className="text-[17px] font-semibold uppercase tracking-[0.1em]">Your bag <span className="font-sans text-sm text-mute">({cart.reduce((n, item) => n + item.quantity, 0)})</span></h2>
          <button onClick={closeBag} aria-label="Close bag" className="grid size-10 place-items-center border border-line transition-transform duration-500 ease-silk hover:rotate-90"><X size={17} /></button>
        </header>

        <div className="mx-6 bg-yellow-light p-4">
          <p className="text-[13px]">{progress >= 1 ? <>You&rsquo;ve unlocked <strong>free shipping</strong>.</> : <>Add <strong>{formatPrice(FREE_SHIPPING_AT - subtotal)}</strong> more for free shipping.</>}</p>
          <div className="mt-3 flex justify-between" aria-hidden="true">
            {Array.from({ length: DOTS }, (_, index) => (
              <span key={index} className={`size-2 rounded-full border transition-colors duration-500 ${index < filled ? "border-green bg-green" : "border-ink/20"}`} style={{ transitionDelay: `${index * 18}ms` }} />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length === 0 ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <p className="mt-3 text-[15px] font-semibold uppercase tracking-[0.1em]">Your bag is empty.</p>
                <Link href="/shop" className="btn btn-primary mt-6">Explore the edit</Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-ink/10">
              {cart.map((item) => (
                <li key={`${item.productId}-${item.size}`} data-bag-item className="flex gap-4 py-4">
                  <Link href={`/products/${item.slug}`} className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-2xl bg-cream">
                    {item.photo && <Image src={item.photo} alt={item.name} fill sizes="96px" unoptimized={item.photo.startsWith("data:")} className="object-cover object-[center_20%]" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-3">
                      <Link href={`/products/${item.slug}`} className="font-medium leading-snug">{item.name}</Link>
                      <p className="shrink-0 text-sm">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                    <p className="mt-1 text-xs text-mute">Size {item.size}</p>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex h-9 items-center border border-line">
                        <button aria-label={`Decrease ${item.name}`} className="grid size-9 place-items-center" onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}><Minus size={13} /></button>
                        <span aria-live="polite" className="w-6 text-center text-sm">{item.quantity}</span>
                        <button aria-label={`Increase ${item.name}`} className="grid size-9 place-items-center" onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}><Plus size={13} /></button>
                      </div>
                      <button className="text-xs text-mute underline-offset-4 hover:text-ink hover:underline" onClick={() => removeFromCart(item.productId, item.size)}>Remove</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.length > 0 && (
          <footer className="border-t border-ink/10 px-6 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-mute">Subtotal</span>
              <span className="text-[15px] font-semibold uppercase tracking-[0.1em]">{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-mute">Shipping and promotions are applied at checkout.</p>
            <Link href="/checkout" className="btn btn-primary mt-5 h-14 w-full">Checkout securely</Link>
            <Link href="/cart" className="mt-3 block text-center text-xs font-semibold uppercase tracking-[0.16em] text-ink/70 link-underline">View full bag</Link>
          </footer>
        )}
      </aside>
    </div>
  );
}
