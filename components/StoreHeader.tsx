"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { categories as seedCategories, type Category } from "@/lib/products";
import { firebaseReady, subscribeCategories } from "@/lib/firebase";

export function StoreHeader({ count = 0 }: { count?: number }) {
  const [categories, setCategories] = useState<Category[]>(seedCategories);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseReady) return;
    return subscribeCategories((items) => items.length && setCategories(items));
  }, []);

  const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  const links = [
    { href: "/collections", label: "Collections" },
    { href: "/#craft", label: "Craft" },
    { href: "/#journal", label: "Journal" },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-green/20 bg-green-light">
      <div className="flex h-9 items-center justify-center bg-green-dark px-4 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
        Free shipping over ₹3,000 · Hand-tied in Gujarat
      </div>
      <div className="container-max flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <button
          aria-label="Open menu"
          className="grid size-10 place-items-center lg:hidden"
          onClick={() => setMenuOpen(true)}
        >
          <Menu size={22} />
        </button>

        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/brand/baagay-logo.svg" alt="BAAGAY logo" width={40} height={40} className="size-9 rounded-full" />
          <span className="text-xl font-bold tracking-tight">BAAGAY</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold lg:flex">
          <div className="relative" onMouseEnter={() => setShopOpen(true)} onMouseLeave={() => setShopOpen(false)}>
            <Link href="/shop" className="flex items-center gap-1 py-6">
              Shop <ChevronDown size={14} />
            </Link>
            {shopOpen && (
              <div className="absolute left-1/2 top-full w-[560px] -translate-x-1/2 border border-line bg-white p-6 shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
                <div className="grid grid-cols-3 gap-6">
                  {sortedCategories.map((category) => (
                    <div key={category.id}>
                      <Link href={`/shop?category=${category.id}`} className="text-sm font-bold text-green-dark">
                        {category.name}
                      </Link>
                      <ul className="mt-3 grid gap-2">
                        {(category.subcategories ?? []).map((sub) => (
                          <li key={sub.id}>
                            <Link
                              href={`/shop?category=${category.id}&subcategory=${sub.id}`}
                              className="text-sm text-mute hover:text-green-dark"
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button aria-label="Search" className="hidden size-10 place-items-center sm:grid">
            <Search size={19} />
          </button>
          <button aria-label="Account" className="grid size-10 place-items-center">
            <UserRound size={19} />
          </button>
          <button aria-label="Cart" className="relative grid size-10 place-items-center">
            <ShoppingBag size={19} />
            {count > 0 && (
              <span className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-pink-dark text-[9px] font-bold text-white">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setMenuOpen(false)}>
          <aside
            className="flex h-full w-[86vw] max-w-sm flex-col overflow-y-auto bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line p-4">
              <Link href="/" className="flex items-center gap-2.5" onClick={() => setMenuOpen(false)}>
                <Image src="/brand/baagay-logo.svg" alt="BAAGAY logo" width={36} height={36} className="size-8 rounded-full" />
                <span className="text-lg font-bold">BAAGAY</span>
              </Link>
              <button aria-label="Close menu" className="grid size-9 place-items-center" onClick={() => setMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col">
              <Link href="/shop" className="border-b border-line px-4 py-4 text-sm font-bold" onClick={() => setMenuOpen(false)}>
                Shop all
              </Link>
              {sortedCategories.map((category) => (
                <div key={category.id} className="border-b border-line">
                  <button
                    className="flex w-full items-center justify-between px-4 py-4 text-sm font-bold"
                    onClick={() => setOpenAccordion(openAccordion === category.id ? null : category.id)}
                  >
                    {category.name}
                    {(category.subcategories?.length ?? 0) > 0 && (
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${openAccordion === category.id ? "rotate-180" : ""}`}
                      />
                    )}
                  </button>
                  {openAccordion === category.id && (
                    <ul className="grid gap-1 bg-green-light/60 px-4 pb-4">
                      <li>
                        <Link
                          href={`/shop?category=${category.id}`}
                          className="block py-2 text-sm text-green-dark"
                          onClick={() => setMenuOpen(false)}
                        >
                          All {category.name}
                        </Link>
                      </li>
                      {(category.subcategories ?? []).map((sub) => (
                        <li key={sub.id}>
                          <Link
                            href={`/shop?category=${category.id}&subcategory=${sub.id}`}
                            className="block py-2 text-sm text-mute"
                            onClick={() => setMenuOpen(false)}
                          >
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="border-b border-line px-4 py-4 text-sm font-bold"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto">
              <p className="bg-cream px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-green-dark">
                Tied with Tradition. Crafted with Love.
              </p>
              <div aria-hidden className="h-24 w-full bg-[url('/brand/baagay-artwork.jpg')] bg-cover bg-center" />
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
