"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { firebaseReady, saveNewsletterSubscription } from "@/lib/firebase";
import { CONTACT, SITE_MEDIA } from "@/lib/site";
import { useCatalog } from "@/hooks/useCatalog";
import { Wordmark } from "@/components/Wordmark";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

/** A full-bleed painting with the brand, the newsletter and four link columns
 * laid over its quieter left side. */
export function SiteFooter() {
  const { categories } = useCatalog();
  const root = useRef<HTMLElement>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.fromTo("[data-footer-art]", { yPercent: -10 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom bottom", scrub: true } });
      gsap.from("[data-footer-item]", { y: 24, autoAlpha: 0, duration: 1, stagger: 0.07, scrollTrigger: { trigger: root.current, start: "top 70%", once: true } });
    });
    return () => mm.revert();
  }, { scope: root });

  async function handleSubscribe() {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    setStatus("saving");
    setMessage("");
    try {
      await saveNewsletterSubscription(trimmed);
      setStatus("done");
      setMessage("Thank you — you're part of the journey now.");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not subscribe. Please try again.");
    }
  }

  const columns = [
    { title: "Shop", links: [...sorted.map((category) => ({ href: `/shop?category=${category.id}`, label: category.name })), { href: "/collections", label: "Collections" }] },
    { title: "About Us", links: [{ href: "/#about", label: "Our Story" }, { href: "/#craft", label: "Craft" }, { href: "/journal", label: "Journal" }] },
    { title: "Legal", links: [{ href: "/refund-policy", label: "Shipping and Returns" }, { href: "/user-agreement", label: "Terms of Use" }, { href: "/privacy-policy", label: "Privacy Policy" }] },
    { title: "Connect", links: [{ href: `mailto:${CONTACT.email}`, label: "Contact Us" }, ...(CONTACT.instagram ? [{ href: CONTACT.instagram, label: "Instagram" }] : []), ...(CONTACT.whatsapp ? [{ href: `https://wa.me/${CONTACT.whatsapp}`, label: "WhatsApp" }] : [])] },
  ];

  return (
    <footer ref={root} className="relative isolate overflow-hidden text-white">
      <div data-footer-art className="absolute inset-[-10%_0] -z-10">
        <Image src={SITE_MEDIA.footer} alt="" fill sizes="100vw" className="object-cover" />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/65 via-black/35 to-black/5" />

      <div className="container-max gutter py-14 sm:py-16">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-20">
        <div className="max-w-sm">
          <div data-footer-item><Wordmark tone={SITE_MEDIA.footerWordmark} className="text-[56px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.25)] sm:text-[68px]" /></div>
          <h2 data-footer-item className="mt-6 text-[22px] font-semibold">Be a Part of Our Journey</h2>
          <p data-footer-item className="mt-3 text-[13px] leading-6 text-white/80">Hand-tied stories, new drops and festive edits from Gujarat — a few letters a season, never noise.</p>
          <form data-footer-item className="mt-7" onSubmit={(event) => { event.preventDefault(); void handleSubscribe(); }}>
            <label className="flex items-center border-b border-white/80 pb-2 focus-within:border-white">
              <span className="sr-only">Email address</span>
              <input type="email" required placeholder="EMAIL" value={email} onChange={(event) => setEmail(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-[12px] tracking-[0.14em] text-white outline-none placeholder:text-white/80" />
              <button type="submit" aria-label="Subscribe" disabled={!firebaseReady || status === "saving"} className="grid size-8 place-items-center transition-transform hover:translate-x-1"><ArrowRight size={16} /></button>
            </label>
            {message && <p role="status" className={`mt-2 text-[12px] ${status === "error" ? "text-pink" : "text-yellow"}`}>{message}</p>}
          </form>
        </div>

        <div className="grid max-w-md grid-cols-2 gap-x-10 gap-y-10 lg:max-w-none lg:grid-cols-4 lg:self-end">
          {columns.map((column) => (
            <div key={column.title} data-footer-item>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em]">{column.title}</p>
              <ul className="mt-3 grid gap-2 text-[12px] text-white/85">
                {column.links.map((link) => <li key={link.href}><Link href={link.href} className="link-underline hover:text-white">{link.label}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
        </div>

        <p className="mt-14 text-[11px] text-white/60">© {new Date().getFullYear()} BAAGAY · Tied with tradition, crafted with love.</p>
      </div>
    </footer>
  );
}
