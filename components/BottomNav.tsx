"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Heart, House, Search, ShoppingBag, Shirt, type LucideIcon } from "lucide-react";
import { useCommerce } from "@/components/CommerceProvider";
import { gsap, MOTION_OK } from "@/lib/gsap";

/** Routes with their own bottom actions (or none) where the bar would get in the way. */
const HIDDEN_ON = ["/checkout", "/admin", "/order-confirmation", "/products/"];

type Item = { key: string; label: string; icon: LucideIcon; href?: string; active: (path: string) => boolean; count?: number };

/** Floating app-style tab bar for phones and tablets. It tucks away while the
 * shopper scrolls down through content and returns as soon as they scroll up. */
export function BottomNav() {
  const pathname = usePathname();
  const { cartCount, wishlist, openBag, bagOpen } = useCommerce();
  const [hidden, setHidden] = useState(false);
  const bagBadge = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const nearBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 40;
        if (Math.abs(y - last) > 8) setHidden(y > last && y > 120 && !nearBottom);
        last = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setHidden(false); }, [pathname]);

  useEffect(() => {
    if (!cartCount || !bagBadge.current || !window.matchMedia(MOTION_OK).matches) return;
    gsap.fromTo(bagBadge.current, { scale: 0.4 }, { scale: 1, duration: 0.7, ease: "elastic.out(1, 0.4)" });
  }, [cartCount]);

  if (HIDDEN_ON.some((prefix) => pathname.startsWith(prefix))) return null;

  const items: Item[] = [
    { key: "home", label: "Home", icon: House, href: "/", active: (path) => path === "/" },
    { key: "shop", label: "Shop", icon: Shirt, href: "/shop", active: (path) => path.startsWith("/shop") || path.startsWith("/collections") },
    { key: "search", label: "Search", icon: Search, href: "/search", active: (path) => path.startsWith("/search") },
    { key: "saved", label: "Saved", icon: Heart, href: "/wishlist", active: (path) => path.startsWith("/wishlist"), count: wishlist.length },
    { key: "bag", label: "Bag", icon: ShoppingBag, active: (path) => bagOpen || path.startsWith("/cart"), count: cartCount },
  ];

  return (
    <>
      <nav aria-label="Quick navigation"
        className={`fixed inset-x-3 bottom-[calc(10px+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md transition-transform duration-500 ease-silk lg:hidden ${hidden ? "translate-y-[calc(100%+24px+env(safe-area-inset-bottom))]" : "translate-y-0"}`}>
        <ul className="grid grid-cols-5 rounded-[22px] border border-white/60 bg-white/80 p-1.5 shadow-[0_12px_40px_-8px_rgba(20,30,10,0.35)] backdrop-blur-xl backdrop-saturate-150">
          {items.map((item) => {
            const isActive = item.active(pathname);
            const Icon = item.icon;
            const body = (
              <>
                <span className={`relative grid h-8 w-12 place-items-center rounded-full transition-colors duration-300 ${isActive ? "bg-green text-white" : "text-ink/70"}`}>
                  <Icon size={19} strokeWidth={isActive ? 2 : 1.7} fill={item.key === "saved" && isActive ? "currentColor" : "none"} />
                  {Boolean(item.count) && (
                    <span ref={item.key === "bag" ? bagBadge : undefined}
                      className="absolute -right-0.5 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-pink px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                      {item.count! > 9 ? "9+" : item.count}
                    </span>
                  )}
                </span>
                <span className={`text-[10px] font-semibold tracking-[0.04em] ${isActive ? "text-green" : "text-ink/60"}`}>{item.label}</span>
              </>
            );
            const className = "flex w-full flex-col items-center gap-0.5 rounded-2xl py-1 outline-offset-2 active:scale-95 transition-transform";
            const label = item.count ? `${item.label}, ${item.count} item${item.count === 1 ? "" : "s"}` : item.label;
            return (
              <li key={item.key}>
                {item.href
                  ? <Link href={item.href} aria-label={label} aria-current={isActive ? "page" : undefined} className={className}>{body}</Link>
                  : <button type="button" onClick={openBag} aria-label={label} className={className}>{body}</button>}
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
