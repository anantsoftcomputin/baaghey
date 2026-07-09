"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, LayoutGrid, ShoppingBag, UserRound } from "lucide-react";

type Tab = {
  href: string;
  label: string;
  icon: typeof Home;
  isActive: (pathname: string) => boolean;
};

const TABS: Tab[] = [
  { href: "/", label: "Home", icon: Home, isActive: (path) => path === "/" },
  { href: "/shop", label: "Shop", icon: LayoutGrid, isActive: (path) => path.startsWith("/shop") },
  { href: "/wishlist", label: "Wishlist", icon: Heart, isActive: (path) => path.startsWith("/wishlist") },
  { href: "/cart", label: "Cart", icon: ShoppingBag, isActive: (path) => path.startsWith("/cart") },
  { href: "/account", label: "Account", icon: UserRound, isActive: (path) => path.startsWith("/account") },
];

export function BottomNav({ count = 0 }: { count?: number }) {
  const pathname = usePathname() ?? "/";

  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="grid grid-cols-5">
        {TABS.map((tab) => {
          const active = tab.isActive(pathname);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-col items-center justify-center gap-1 py-2.5"
            >
              <span className="relative">
                <Icon size={20} className={active ? "text-black" : "text-faint"} strokeWidth={active ? 2.4 : 1.7} />
                {tab.href === "/cart" && count > 0 && (
                  <span className="absolute -right-2 -top-1.5 grid size-4 place-items-center rounded-full bg-black text-[9px] font-bold text-white">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </span>
              <span className={`text-[10px] tracking-wide ${active ? "font-bold text-black" : "text-faint"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
