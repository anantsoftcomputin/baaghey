"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { StoreHeader } from "@/components/StoreHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useCatalog } from "@/hooks/useCatalog";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

type SortMode = "featured" | "price-low" | "price-high" | "newest";
const MAX_PRICE = 12000;

export default function ShopPage() {
  return <Suspense fallback={<main className="min-h-screen" />}><ShopContent /></Suspense>;
}

function ShopContent() {
  const { activeProducts, categories } = useCatalog();
  const searchParams = useSearchParams();
  const grid = useRef<HTMLDivElement>(null);
  const [category, setCategory] = useState("all");
  const [subcategory, setSubcategory] = useState("all");
  const [material, setMaterial] = useState("all");
  const [size, setSize] = useState("all");
  const [stockOnly, setStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [sort, setSort] = useState<SortMode>("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setCategory(searchParams.get("category") ?? "all");
    setSubcategory(searchParams.get("subcategory") ?? "all");
  }, [searchParams]);

  const sortedCategories = useMemo(() => [...categories].sort((a, b) => a.sortOrder - b.sortOrder), [categories]);
  const materials = useMemo(() => Array.from(new Set(activeProducts.map((product) => product.material))).sort(), [activeProducts]);
  const sizes = useMemo(() => Array.from(new Set(activeProducts.flatMap((product) => product.sizes))), [activeProducts]);
  const activeCategory = categories.find((item) => item.id === category);

  const filtered = useMemo(() => {
    const list = activeProducts
      .filter((product) => category === "all" || product.category === category)
      .filter((product) => subcategory === "all" || product.subcategory === subcategory)
      .filter((product) => material === "all" || product.material === material)
      .filter((product) => size === "all" || product.sizes.includes(size))
      .filter((product) => !stockOnly || product.inventory > 0)
      .filter((product) => (product.salePrice ?? product.price) <= maxPrice);
    return [...list].sort((a, b) => {
      if (sort === "price-low") return (a.salePrice ?? a.price) - (b.salePrice ?? b.price);
      if (sort === "price-high") return (b.salePrice ?? b.price) - (a.salePrice ?? a.price);
      if (sort === "newest") return (b.createdAt ?? 0) - (a.createdAt ?? 0) || b.id.localeCompare(a.id);
      return Number(b.featured) - Number(a.featured);
    });
  }, [activeProducts, category, subcategory, material, maxPrice, size, sort, stockOnly]);

  const chips = [
    material !== "all" && { label: material, clear: () => setMaterial("all") },
    size !== "all" && { label: `Size ${size}`, clear: () => setSize("all") },
    maxPrice < MAX_PRICE && { label: `Under ₹${maxPrice.toLocaleString("en-IN")}`, clear: () => setMaxPrice(MAX_PRICE) },
    stockOnly && { label: "In stock", clear: () => setStockOnly(false) },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  // Cards rise in whenever the result set changes.
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.from("[data-shop-cell]", { y: 50, autoAlpha: 0, duration: 1, stagger: 0.06, clearProps: "all" });
    });
    return () => mm.revert();
  }, { scope: grid, dependencies: [filtered.map((product) => product.id).join()], revertOnUpdate: true });

  const title = activeCategory?.name ?? "All clothing";

  return (
    <main className="min-h-screen">
      <StoreHeader />

      <section className="container-max gutter pb-24 pt-[124px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="page-title">{title}</h1>
            <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-mute">{filtered.length} {filtered.length === 1 ? "piece" : "pieces"}</p>
          </div>
          <div className="flex items-center gap-5 text-[11px] font-semibold uppercase tracking-[0.12em]">
            <button className="inline-flex items-center gap-1.5" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal size={13} /> Filter{chips.length > 0 && <span className="text-mute">({chips.length})</span>}
            </button>
            <label className="inline-flex items-center gap-1">
              <span className="sr-only">Sort by</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="cursor-pointer appearance-none bg-transparent pr-4 font-semibold uppercase tracking-[0.12em] outline-none">
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
              </select>
              <ChevronDown size={12} className="-ml-4 pointer-events-none" />
            </label>
          </div>
        </div>

        <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto">
          <button className="chip" aria-pressed={category === "all"} onClick={() => { setCategory("all"); setSubcategory("all"); }}>All</button>
          {sortedCategories.map((item) => (
            <button key={item.id} className="chip" aria-pressed={category === item.id} onClick={() => { setCategory(item.id); setSubcategory("all"); }}>{item.name}</button>
          ))}
          {(activeCategory?.subcategories ?? []).map((sub) => (
            <button key={sub.id} className="chip border-dashed" aria-pressed={subcategory === sub.id} onClick={() => setSubcategory(subcategory === sub.id ? "all" : sub.id)}>{sub.name}</button>
          ))}
        </div>

        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button key={chip.label} onClick={chip.clear} className="inline-flex h-7 items-center gap-1.5 bg-cream px-2.5 text-[11px] hover:bg-line">{chip.label} <X size={11} /></button>
            ))}
          </div>
        )}

        <div ref={grid} className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
          {filtered.map((product, index) => (
            <div key={product.id} data-shop-cell><ProductCard product={product} priority={index < 4} /></div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-24 text-center">
            <p className="label">Nothing matches these filters</p>
            <button className="btn btn-outline mt-6" onClick={() => { setMaterial("all"); setSize("all"); setStockOnly(false); setMaxPrice(MAX_PRICE); setCategory("all"); setSubcategory("all"); }}>Clear filters</button>
          </div>
        )}
      </section>

      <SiteFooter />

      {filtersOpen && (
        <FilterPanel onClose={() => setFiltersOpen(false)} count={filtered.length}>
          <FilterGroup label="Size">
            <button className="chip" aria-pressed={size === "all"} onClick={() => setSize("all")}>Any</button>
            {sizes.map((item) => <button key={item} className="chip min-w-11 justify-center" aria-pressed={size === item} onClick={() => setSize(item)}>{item}</button>)}
          </FilterGroup>
          <FilterGroup label="Fabric">
            <button className="chip" aria-pressed={material === "all"} onClick={() => setMaterial("all")}>Any</button>
            {materials.map((item) => <button key={item} className="chip" aria-pressed={material === item} onClick={() => setMaterial(item)}>{item}</button>)}
          </FilterGroup>
          <FilterGroup label={`Up to ₹${maxPrice.toLocaleString("en-IN")}`}>
            <input type="range" min="1000" max={MAX_PRICE} step="500" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} className="w-full accent-[#4E6A31]" aria-label="Maximum price" />
          </FilterGroup>
          <label className="flex items-center justify-between py-5 text-[12px] uppercase tracking-[0.1em]">
            In stock only
            <input type="checkbox" checked={stockOnly} onChange={(event) => setStockOnly(event.target.checked)} className="size-4 accent-[#4E6A31]" />
          </label>
        </FilterPanel>
      )}
    </main>
  );
}

function FilterPanel({ onClose, count, children }: { onClose: () => void; count: number; children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const animate = window.matchMedia(MOTION_OK).matches;
    gsap.from("[data-filter-overlay]", { autoAlpha: 0, duration: animate ? 0.4 : 0 });
    gsap.from("[data-filter-panel]", { xPercent: 100, duration: animate ? 0.8 : 0, ease: "expo.out" });
  }, { scope: root });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div ref={root} className="fixed inset-0 z-[70]">
      <div data-filter-overlay className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <aside data-filter-panel role="dialog" aria-modal="true" aria-label="Filter" className="absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col bg-white">
        <div className="flex items-center justify-between p-6">
          <h2 className="label">Filter</h2>
          <button onClick={onClose} aria-label="Close filters" className="grid size-9 place-items-center"><X size={17} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6">{children}</div>
        <div className="p-6"><button className="btn btn-primary h-12 w-full" onClick={onClose}>Show {count} {count === 1 ? "piece" : "pieces"}</button></div>
      </aside>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line py-5">
      <p className="eyebrow text-ink/60">{label}</p>
      <div className="mt-4 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
