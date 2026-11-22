"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { categoryMedia, productPhoto } from "@/lib/catalog";
import { CONTACT } from "@/lib/site";
import { useCatalog } from "@/hooks/useCatalog";
import { useCommerce } from "@/components/CommerceProvider";
import { Wordmark } from "@/components/Wordmark";
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/gsap";

const LINKS = [
  { href: "/collections", label: "Collections" },
  { href: "/#craft", label: "Craft" },
  { href: "/#about", label: "About Us" },
];

/** `overlay` lets the bar sit transparently over a full-bleed hero until the
 * page scrolls. `count` is accepted for backwards compatibility. */
export function StoreHeader({ overlay = false, count }: { overlay?: boolean; count?: number } = {}) {
  void count;
  const { cartCount, openAuth, openBag, user } = useCommerce();
  const { categories, promotion, activeProducts } = useCatalog();
  const pathname = usePathname();
  const header = useRef<HTMLElement>(null);
  const mega = useRef<HTMLDivElement>(null);
  const badge = useRef<HTMLSpanElement>(null);
  const [megaOpen, setMegaOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
  const solid = !overlay || scrolled || megaOpen;

  useEffect(() => { setMenuOpen(false); setMegaOpen(false); }, [pathname]);
  useEffect(() => { document.body.style.overflow = menuOpen ? "hidden" : ""; }, [menuOpen]);

  useGSAP(() => {
    const el = header.current;
    if (!el) return;
    // The announcement strip tucks away on scroll down; the bar stays.
    const shift = gsap.quickTo(el, "y", { duration: 0.5, ease: "expo.out" });
    const trigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        setScrolled(self.scroll() > 40);
        shift(self.scroll() > 200 && self.direction === 1 ? -28 : 0);
      },
    });
    return () => trigger.kill();
  }, { scope: header });

  useGSAP(() => {
    if (!badge.current || !cartCount || !window.matchMedia(MOTION_OK).matches) return;
    gsap.fromTo(badge.current, { scale: 1.8 }, { scale: 1, duration: 0.7, ease: "elastic.out(1, 0.45)" });
  }, { dependencies: [cartCount] });

  useGSAP(() => {
    if (!megaOpen || !mega.current || !window.matchMedia(MOTION_OK).matches) return;
    gsap.fromTo(mega.current, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.6, ease: "expo.out" });
    gsap.from(mega.current.querySelectorAll("[data-mega]"), { y: 16, autoAlpha: 0, stagger: 0.05, duration: 0.6, delay: 0.08 });
  }, { dependencies: [megaOpen] });

  return (
    <>
      <header ref={header} className="fixed inset-x-0 top-0 z-50" onMouseLeave={() => setMegaOpen(false)}>
        <div className="flex h-7 items-center justify-center bg-yellow-light px-4 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-ink/80">
          {promotion ? `${promotion.discountPercent}% off · use code ${promotion.code}` : "Free shipping in India on orders over ₹3,000"}
        </div>
        <div className={`transition-colors duration-500 ${solid ? "bg-green text-white shadow-[0_1px_0_rgba(0,0,0,0.06)]" : "bg-transparent text-white"}`}>
          <div className="container-max gutter grid h-16 grid-cols-[1fr_auto_1fr] items-center">
            <nav className="flex items-center gap-1 lg:gap-7" aria-label="Main">
              <button aria-label="Open menu" className="-ml-2 grid size-11 place-items-center lg:hidden" onClick={() => setMenuOpen(true)}><Menu size={20} strokeWidth={1.6} /></button>
              <Link href="/shop" onMouseEnter={() => setMegaOpen(true)} onFocus={() => setMegaOpen(true)} aria-expanded={megaOpen}
                className="hidden items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] lg:flex">
                Clothing <ChevronDown size={12} className={`transition-transform duration-300 ${megaOpen ? "rotate-180" : ""}`} />
              </Link>
              {LINKS.map((link) => (
                <Link key={link.href} href={link.href} onMouseEnter={() => setMegaOpen(false)} className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] link-underline lg:block">{link.label}</Link>
              ))}
            </nav>

            <Link href="/" aria-label="BAAGAY home" className="transition-transform duration-500 hover:scale-[1.04]">
              <Wordmark tone="yellow" className="text-[30px] sm:text-[34px]" />
            </Link>

            <div className="flex items-center justify-end">
              <Link href="/search" aria-label="Search" className="hidden size-10 place-items-center lg:grid"><Search size={18} strokeWidth={1.7} /></Link>
              {user
                ? <Link href="/account" aria-label="Your account" className="grid size-10 place-items-center"><UserRound size={18} strokeWidth={1.7} /></Link>
                : <button aria-label="Sign in" className="grid size-10 place-items-center" onClick={openAuth}><UserRound size={18} strokeWidth={1.7} /></button>}
              <button onClick={openBag} aria-label={`Open bag, ${cartCount} items`} className={`relative size-10 place-items-center ${pathname.startsWith("/products/") ? "grid" : "hidden lg:grid"}`}>
                <ShoppingBag size={18} strokeWidth={1.7} />
                {cartCount > 0 && <span ref={badge} className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-pink text-[9px] font-bold text-white">{cartCount > 9 ? "9+" : cartCount}</span>}
              </button>
            </div>
          </div>

          {megaOpen && (
            <div ref={mega} className="hidden border-t border-white/15 bg-white text-ink lg:block">
              <div className="container-max gutter grid grid-cols-[1fr_1fr_1fr_1fr] gap-8 py-9">
                <div data-mega>
                  <p className="label">Shop</p>
                  <ul className="mt-4 grid gap-2.5 text-[13px]">
                    <li><Link href="/shop" className="link-underline">All clothing</Link></li>
                    {sorted.map((category) => <li key={category.id}><Link href={`/shop?category=${category.id}`} className="link-underline">{category.name}</Link></li>)}
                    <li><Link href="/collections" className="link-underline">Collections</Link></li>
                  </ul>
                </div>
                {sorted.slice(0, 3).map((category) => {
                  const cover = activeProducts.find((product) => product.category === category.id && product.featured) ?? activeProducts.find((product) => product.category === category.id);
                  const media = categoryMedia(category, cover && productPhoto(cover));
                  return (
                    <Link key={category.id} href={`/shop?category=${category.id}`} data-mega className="group block">
                      <div className="relative aspect-[4/5] overflow-hidden bg-cream">
                        {media?.type === "photo" && <Image src={media.src} alt="" fill sizes="20vw" unoptimized={media.src.startsWith("data:")} className="object-cover object-[center_20%] transition-transform duration-1000 ease-silk group-hover:scale-105" />}
                        {media?.type === "video" && <video src={media.src} muted loop playsInline autoPlay className="absolute inset-0 h-full w-full object-cover" />}
                        <span className="absolute inset-0 grid place-items-center bg-ink/10 text-[13px] font-bold uppercase tracking-[0.18em] text-white">{category.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </header>

      {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} categories={sorted} signedIn={Boolean(user)} onAccount={openAuth} />}
    </>
  );
}

/** Two-column link lists, as in the mobile reference on the board. */
function MobileMenu({ onClose, categories, signedIn, onAccount }: { onClose: () => void; categories: { id: string; name: string }[]; signedIn: boolean; onAccount: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (!window.matchMedia(MOTION_OK).matches) return;
    gsap.from(root.current, { xPercent: -100, duration: 0.7, ease: "expo.out" });
    gsap.from("[data-menu-group]", { y: 20, autoAlpha: 0, duration: 0.7, stagger: 0.06, delay: 0.2 });
  }, { scope: root });

  const groups: { title: string; links: { href: string; label: string }[] }[] = [
    { title: "Shop", links: [{ href: "/shop", label: "All clothing" }, ...categories.map((category) => ({ href: `/shop?category=${category.id}`, label: category.name }))] },
    { title: "Explore", links: [{ href: "/collections", label: "Collections" }, { href: "/#craft", label: "Craft" }, { href: "/journal", label: "Journal" }, { href: "/#about", label: "Our story" }] },
    { title: "Help", links: [{ href: "/refund-policy", label: "Shipping & returns" }, { href: "/user-agreement", label: "Terms of use" }, { href: "/privacy-policy", label: "Privacy policy" }] },
    { title: "Connect", links: [{ href: `mailto:${CONTACT.email}`, label: "Contact us" }, ...(CONTACT.instagram ? [{ href: CONTACT.instagram, label: "Instagram" }] : []), ...(CONTACT.whatsapp ? [{ href: `https://wa.me/${CONTACT.whatsapp}`, label: "WhatsApp" }] : [])] },
  ];

  return (
    <div ref={root} role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-[80] flex flex-col overflow-y-auto bg-white lg:hidden">
      <div className="flex h-16 items-center justify-between bg-green px-4 text-white">
        <Wordmark tone="yellow" className="text-[28px]" />
        <button onClick={onClose} aria-label="Close menu" className="grid size-11 place-items-center"><X size={20} /></button>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-9 px-5 py-8">
        {groups.map((group) => (
          <div key={group.title} data-menu-group>
            <p className="eyebrow text-mute">{group.title}</p>
            <ul className="mt-4 grid gap-3 text-[14px]">
              {group.links.map((link) => <li key={link.href}><Link href={link.href} onClick={onClose}>{link.label}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-auto grid grid-cols-2 gap-2 border-t border-line p-5">
        <Link href="/wishlist" onClick={onClose} className="btn btn-outline h-11">Wishlist</Link>
        {signedIn ? <Link href="/account" onClick={onClose} className="btn btn-primary h-11">Account</Link> : <button onClick={() => { onClose(); onAccount(); }} className="btn btn-primary h-11">Sign in</button>}
      </div>
    </div>
  );
}
