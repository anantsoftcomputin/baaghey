import type { ReactNode } from "react";
import { StoreHeader } from "@/components/StoreHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PageIntro } from "@/components/PageIntro";

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
    <main className="min-h-screen">
      <StoreHeader />
      <section className="container-max gutter pb-24 pt-[124px]">
        <PageIntro eyebrow={`Last updated ${updated}`} title={title}>{intro}</PageIntro>
        <div className="mt-8 max-w-3xl">{children}</div>
      </section>
      <SiteFooter />
    </main>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="mt-10 border-t border-ink/10 pt-8">
      <h2 className="text-[15px] font-semibold uppercase tracking-[0.1em]">{heading}</h2>
      <div className="mt-4 grid gap-3 text-[15px] leading-7 text-ink/70 [&_strong]:text-ink">{children}</div>
    </section>
  );
}
