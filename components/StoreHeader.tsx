"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingBag, UserRound } from "lucide-react";
import { StitchDivider } from "@/components/Motifs";

export function StoreHeader({ count = 0 }: { count?: number }) {
  const links = [
    { href: "/shop", label: "Shop" },
    { href: "/collections", label: "Collections" },
    { href: "/#craft", label: "Craft" },
    { href: "/#journal", label: "Journal" },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-[#fffdf1]/92 backdrop-blur-xl">
      <div className="flex h-9 items-center justify-center bg-ink px-4 text-center text-[11px] font-extrabold uppercase tracking-[0.18em] text-kesar">
        Print nathi, Bandhej che · hand-tied in Gujarat
      </div>
      <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/brand/baagay-logo.svg" alt="BAAGAY logo" width={58} height={58} className="size-11 rounded-full sm:size-14" />
          <span className="font-display text-2xl font-bold tracking-normal sm:text-3xl">BAAGAY</span>
        </Link>
        <nav className="hidden items-center gap-8 text-xs font-extrabold uppercase tracking-[0.2em] lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button aria-label="Search" className="hidden size-11 place-items-center border border-black/15 sm:grid">
            <Search size={18} />
          </button>
          <button aria-label="Account" className="grid size-11 place-items-center border border-black/15">
            <UserRound size={18} />
          </button>
          <button aria-label="Cart" className="relative hidden size-11 place-items-center bg-neem text-kesar lg:grid">
            <ShoppingBag size={18} />
            <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-gulal text-[10px] font-black text-ink">{count}</span>
          </button>
        </div>
      </div>
      <StitchDivider tone="text-neem/50" />
    </header>
  );
}
