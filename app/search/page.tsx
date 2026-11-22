"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { StoreHeader } from "@/components/StoreHeader";
import { ProductCard } from "@/components/ProductCard";
import { SiteFooter } from "@/components/SiteFooter";
import { useCatalog } from "@/hooks/useCatalog";

const SUGGESTIONS = ["Red", "Dress", "Overshirt", "Cotton", "Chaubundi", "Teal"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const { activeProducts } = useCatalog();
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return activeProducts;
    return activeProducts.filter((product) => [product.name, product.category, product.material, product.color, product.craft, product.details ?? "", ...product.tags].join(" ").toLowerCase().includes(needle));
  }, [activeProducts, query]);
  return (
    <main className="min-h-screen">
      <StoreHeader />
      <section className="container-max gutter pb-28 pt-[124px]">
        <h1 className="sr-only">Search BAAGAY</h1>
        <label className="flex items-center gap-4 border-b border-ink/30 pb-4 focus-within:border-ink">
          <Search size={30} strokeWidth={1.4} className="shrink-0 text-mute" />
          <span className="sr-only">Search products</span>
          <input autoFocus type="search" className="w-full bg-transparent outline-none focus-visible:outline-none placeholder:text-ink/35 text-[22px] font-semibold uppercase tracking-[0.1em]" placeholder="Search the edit" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="mr-2 text-sm text-mute">{matches.length} {matches.length === 1 ? "piece" : "pieces"}</span>
          {SUGGESTIONS.map((term) => <button key={term} className="chip" aria-pressed={query.toLowerCase() === term.toLowerCase()} onClick={() => setQuery(term)}>{term}</button>)}
        </div>
        <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">{matches.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>
      <SiteFooter />
    </main>
  );
}
