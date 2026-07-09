"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { firebaseReady, saveNewsletterSubscription, subscribeCategories } from "@/lib/firebase";
import { categories as seedCategories, type Category } from "@/lib/products";

const EXPLORE_LINKS = [
  { href: "/collections", label: "Collections" },
  { href: "/#craft", label: "The Craft" },
  { href: "/#journal", label: "Journal" },
  { href: "/shop", label: "Shop All" },
];

const POLICY_LINKS = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/refund-policy", label: "Refund Policy" },
  { href: "/user-agreement", label: "User Agreement" },
];

export function SiteFooter() {
  const [categories, setCategories] = useState<Category[]>(seedCategories);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!firebaseReady) return;
    return subscribeCategories((items) => items.length && setCategories(items));
  }, []);

  const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

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
      setMessage("You're on the list. Welcome to our Baagay!");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not subscribe. Please try again.");
    }
  }

  return (
    <footer className="border-t border-yellow-dark/15 bg-cream">
      {/* Newsletter band */}
      <div className="border-b border-yellow-dark/15">
        <div className="container-max grid gap-6 px-4 py-10 sm:px-6 md:grid-cols-2 md:items-center lg:px-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-dark">Newsletter</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Stories from the dye pot, first.</h2>
            <p className="mt-2 text-sm leading-6 text-mute">Festive edits, fresh drops, and craft stories from Gujarat. No noise, one email a month.</p>
          </div>
          <div>
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                handleSubscribe();
              }}
            >
              <input
                type="email"
                required
                className="h-12 flex-1 border border-green/25 bg-white px-4 text-sm outline-none focus:border-green"
                placeholder="Your email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <button
                type="submit"
                className="inline-flex h-12 items-center gap-2 bg-green px-5 text-sm font-bold uppercase tracking-[0.1em] text-white disabled:opacity-60"
                disabled={!firebaseReady || status === "saving"}
              >
                {status === "saving" ? "Saving…" : "Subscribe"} <ArrowRight size={15} />
              </button>
            </form>
            {message && (
              <p className={`mt-2 text-sm ${status === "error" ? "text-accent" : "text-green-dark"}`}>{message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Link columns */}
      <div className="container-max grid gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr] lg:px-10">
        <div>
          <div className="flex items-center gap-3">
            <Image src="/brand/baagay-logo.svg" alt="BAAGAY logo" width={56} height={56} className="size-12 rounded-full" />
            <div>
              <p className="text-2xl font-bold leading-none">BAAGAY</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-green-dark">Tied with Tradition. Crafted with Love.</p>
            </div>
          </div>
          <p className="mt-5 max-w-xs text-sm leading-6 text-mute">
            Modern hand-tied Bandhani shirts, dresses and overshirts — every dot pinched, bound and dyed by hand across Kutch and Saurashtra.
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-green-dark">Shop</p>
          <ul className="mt-4 grid gap-2.5">
            {sortedCategories.map((category) => (
              <li key={category.id}>
                <Link href={`/shop?category=${category.id}`} className="text-sm font-semibold hover:text-green-dark">
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-green-dark">Explore</p>
          <ul className="mt-4 grid gap-2.5">
            {EXPLORE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm font-semibold hover:text-green-dark">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-green-dark">Get in touch</p>
          <ul className="mt-4 grid gap-3 text-sm">
            <li>
              <a href="mailto:hello@baagay.in" className="flex items-center gap-2.5 font-semibold hover:text-green-dark">
                <Mail size={16} className="shrink-0 text-green-dark" /> hello@baagay.in
              </a>
            </li>
            <li>
              <a href="tel:+919876543210" className="flex items-center gap-2.5 font-semibold hover:text-green-dark">
                <Phone size={16} className="shrink-0 text-green-dark" /> +91 98765 43210
              </a>
            </li>
            <li className="flex items-start gap-2.5 text-mute">
              <MapPin size={16} className="mt-0.5 shrink-0 text-green-dark" />
              <span>BAAGAY Studio, Vadodara,<br />Gujarat, India</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-yellow-dark/15">
        <div className="container-max flex flex-col items-center justify-between gap-3 px-4 py-5 pb-24 text-center sm:px-6 md:flex-row md:text-left lg:px-10 lg:pb-5">
          <p className="text-xs text-mute">© {new Date().getFullYear()} BAAGAY. All rights reserved.</p>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {POLICY_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-xs font-semibold text-mute hover:text-green-dark">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
