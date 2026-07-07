"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import { StitchDivider } from "@/components/Motifs";

export function StoreHeader({ count = 0 }: { count?: number }) {
  const [open, setOpen] = useState(false);
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
        <button aria-label="Open menu" className="grid size-11 place-items-center border border-black/15 lg:hidden" onClick={() => setOpen(true)}>
          <Menu size={19} />
        </button>
        <Link href="/" className="flex items-center gap-3">
          <Image src="/brand/baagay-logo.svg" alt="BAAGAY logo" width={58} height={58} className="size-14 rounded-full" />
          <span className="hidden font-display text-3xl font-bold tracking-normal sm:block">BAAGAY</span>
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
          <button aria-label="Cart" className="relative grid size-11 place-items-center bg-neem text-kesar">
            <ShoppingBag size={18} />
            <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-gulal text-[10px] font-black text-ink">{count}</span>
          </button>
        </div>
      </div>
      <StitchDivider tone="text-neem/50" />
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setOpen(false)}>
          <nav className="ml-auto flex h-full w-80 flex-col gap-6 bg-[#fffdf1] p-6 text-sm font-black uppercase tracking-[0.2em]" onClick={(event) => event.stopPropagation()}>
            <button className="ml-auto grid size-10 place-items-center border border-black/15" onClick={() => setOpen(false)}>
              <X />
            </button>
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
