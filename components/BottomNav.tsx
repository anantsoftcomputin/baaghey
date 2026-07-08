"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutGrid, Scissors, Shirt, ShoppingBag } from "lucide-react";
import { StitchDivider } from "@/components/Motifs";

type Tab = {
  href: string;
  label: string;
  icon: typeof Shirt;
  isActive: (pathname: string, hash: string) => boolean;
};

// Home sits in the centre as a raised roundel (the brand mark), flanked by
// two tabs on either side, with Cart on the far end.
const LEFT_TABS: Tab[] = [
  { href: "/shop", label: "Shop", icon: Shirt, isActive: (path) => path.startsWith("/shop") },
  { href: "/collections", label: "Collections", icon: LayoutGrid, isActive: (path) => path.startsWith("/collections") },
];

const RIGHT_TABS: Tab[] = [
  { href: "/#craft", label: "Craft", icon: Scissors, isActive: (path, hash) => path === "/" && hash === "#craft" },
];

const isHomeActive = (path: string, hash: string) => path === "/" && hash !== "#craft";

// A native-feeling mobile tab bar: a running-stitch top edge, a small
// hand-tied dot marking the active tab, and the brand mark raised in the
// centre as the Home button — like an app icon docked into the bar.
export function BottomNav({ count = 0 }: { count?: number }) {
  const pathname = usePathname() ?? "/";
  const [hash, setHash] = useState("");

  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const homeActive = isHomeActive(pathname, hash);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 bg-[#fffdf1]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <StitchDivider tone="text-neem/45" />
      <div className="grid grid-cols-5">
        {LEFT_TABS.map((tab) => (
          <TabLink key={tab.label} tab={tab} active={tab.isActive(pathname, hash)} />
        ))}

        <Link href="/" aria-label="Home" aria-current={homeActive ? "page" : undefined} className="relative flex flex-col items-center justify-center">
          <span
            className={`relative -mt-5 grid size-14 place-items-center rounded-full border-4 border-[#fffdf1] bg-neem shadow-[0_6px_16px_rgba(34,56,35,0.35)] transition-transform ${homeActive ? "scale-105" : ""}`}
          >
            <Image src="/brand/baagay-logo.svg" alt="" width={40} height={40} className="size-9 rounded-full" />
            {homeActive && <span className="absolute -top-1.5 size-1.5 rounded-full bg-gulal shadow-[0_0_0_3px_rgba(244,137,139,0.28)]" />}
          </span>
          <span className={`pb-2 pt-1 text-[10px] font-black uppercase tracking-[0.05em] ${homeActive ? "text-sindoor" : "text-mehendi/45"}`}>
            Home
          </span>
        </Link>

        {RIGHT_TABS.map((tab) => (
          <TabLink key={tab.label} tab={tab} active={tab.isActive(pathname, hash)} />
        ))}

        <button type="button" aria-label="Cart" className="relative flex flex-col items-center justify-center gap-1 py-2.5">
          <span className="relative">
            <ShoppingBag size={20} className="text-mehendi/45" strokeWidth={1.7} />
            {count > 0 && (
              <span className="absolute -right-2 -top-1.5 grid size-4 place-items-center rounded-full bg-gulal text-[9px] font-black text-ink">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.05em] text-mehendi/45">Cart</span>
        </button>
      </div>
    </nav>
  );
}

function TabLink({ tab, active }: { tab: Tab; active: boolean }) {
  const Icon = tab.icon;
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className="relative flex flex-col items-center justify-center gap-1 py-2.5"
    >
      {active && <span className="absolute top-1 size-1.5 rounded-full bg-gulal shadow-[0_0_0_3px_rgba(244,137,139,0.28)]" />}
      <Icon size={20} className={active ? "text-sindoor" : "text-mehendi/45"} strokeWidth={active ? 2.4 : 1.7} />
      <span className={`text-[10px] font-black uppercase tracking-[0.05em] ${active ? "text-sindoor" : "text-mehendi/45"}`}>
        {tab.label}
      </span>
    </Link>
  );
}
