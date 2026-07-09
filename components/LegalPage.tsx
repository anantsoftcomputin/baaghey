import type { ReactNode } from "react";
import { StoreHeader } from "@/components/StoreHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BottomNav } from "@/components/BottomNav";

export function LegalPage({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen text-black">
      <StoreHeader />
      <section className="container-max px-4 pb-16 pt-28 sm:px-6 lg:px-10">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold sm:text-5xl">{title}</h1>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-green-dark">Last updated: {updated}</p>
          <p className="mt-5 text-base leading-7 text-mute">{intro}</p>
          <div className="mt-4">{children}</div>
        </div>
      </section>
      <SiteFooter />
      <BottomNav />
    </main>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="mt-8 border-t border-line pt-6">
      <h2 className="text-xl font-bold">{heading}</h2>
      <div className="mt-3 grid gap-3 text-sm leading-7 text-mute [&_strong]:text-black">{children}</div>
    </section>
  );
}
