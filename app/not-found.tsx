import type { Metadata } from "next";
import Link from "next/link";
import { StoreHeader } from "@/components/StoreHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = { title: "Page not found | BAAGAY", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="min-h-screen">
      <StoreHeader />
      <section className="container-max gutter flex min-h-[70svh] flex-col items-center justify-center pb-24 pt-[140px] text-center">
        <p className="eyebrow text-green">404</p>
        <h1 className="mt-4 text-[28px] font-semibold uppercase tracking-[0.1em] sm:text-[36px]">This knot came undone.</h1>
        <p className="mt-4 max-w-md text-[14px] leading-7 text-ink/70">The page you were looking for has moved or no longer exists. The collection is still right where we left it.</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn btn-primary">Shop the collection</Link>
          <Link href="/" className="btn btn-outline">Back to home</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
