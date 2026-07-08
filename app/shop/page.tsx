"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Filter, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { StoreHeader } from "@/components/StoreHeader";
import { BottomNav } from "@/components/BottomNav";
import { MotifField, StitchDivider } from "@/components/Motifs";
import { firebaseReady, subscribeCategories, subscribeProducts } from "@/lib/firebase";
import { categories as seedCategories, products as seedProducts, type Category, type Product } from "@/lib/products";

type SortMode = "featured" | "price-low" | "price-high" | "newest";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [categories, setCategories] = useState<Category[]>(seedCategories);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [material, setMaterial] = useState("all");
  const [size, setSize] = useState("all");
  const [stockOnly, setStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sort, setSort] = useState<SortMode>("featured");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    if (!firebaseReady) return;
    const unsubscribeProducts = subscribeProducts((items) => items.length && setProducts(items));
    const unsubscribeCategories = subscribeCategories((items) => items.length && setCategories(items));
    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextCategory = params.get("category");
    if (nextCategory) setCategory(nextCategory);
  }, []);

  const activeProducts = products.filter((product) => product.status === "active");
  const materials = Array.from(new Set(activeProducts.map((product) => product.material))).sort();
  const sizes = Array.from(new Set(activeProducts.flatMap((product) => product.sizes))).sort();
  const activeFilterCount = [category !== "all", material !== "all", size !== "all", stockOnly, maxPrice < 10000].filter(Boolean).length;

  const filteredProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = activeProducts
      .filter((product) => category === "all" || product.category === category)
      .filter((product) => material === "all" || product.material === material)
      .filter((product) => size === "all" || product.sizes.includes(size))
      .filter((product) => !stockOnly || product.inventory > 0)
      .filter((product) => (product.salePrice ?? product.price) <= maxPrice)
      .filter((product) =>
        !needle ||
        [product.name, product.craft, product.material, product.color, product.tags.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      );

    return list.sort((a, b) => {
      if (sort === "price-low") return (a.salePrice ?? a.price) - (b.salePrice ?? b.price);
      if (sort === "price-high") return (b.salePrice ?? b.price) - (a.salePrice ?? a.price);
      if (sort === "newest") return b.id.localeCompare(a.id);
      return Number(b.featured) - Number(a.featured);
    });
  }, [activeProducts, category, material, maxPrice, query, size, sort, stockOnly]);

  return (
    <main className="min-h-screen text-ink">
      <StoreHeader count={activeProducts.length} />

      <section className="relative px-4 pt-36 sm:px-6 lg:px-10">
        <MotifField variant="b" tone="text-neem" />
        <div className="jali-arch -right-24 top-28 hidden lg:block" />
        <div className="jali-arch -left-32 top-72 hidden rotate-[-8deg] lg:block" />
        <div className="relative z-10 mx-auto grid max-w-[1500px] gap-8 pb-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-neem px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-kesar">
              <Sparkles size={15} /> Hand-tied edit
            </p>
            <h1 className="mt-5 max-w-4xl font-display text-7xl font-bold leading-[0.88] tracking-normal sm:text-8xl">
              Shop Bandhani, filtered beautifully.
            </h1>
          </div>
          <div className="glass-card p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-gulal">BAAGAY catalog</p>
            <p className="mt-4 text-sm leading-7 text-black/66">
              Discover modern hand-tied shirts, dresses, and layers. Every piece carries Bandhej irregularities, small-batch inventory, and a Gujarati craft story.
            </p>
            <a href="#products" className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-neem">
              Browse {activeProducts.length} pieces <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </section>

      <section id="products" className="relative z-10 mx-auto grid max-w-[1500px] gap-8 px-4 pb-28 pt-3 sm:px-6 lg:grid-cols-[310px_1fr] lg:px-10 lg:pb-20">
        <aside className="glass-card hidden h-fit p-5 lg:sticky lg:top-32 lg:block">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-[0.2em]">Filters</h2>
            <Filter size={17} />
          </div>
          <FilterFields
            query={query} onQuery={setQuery}
            category={category} onCategory={setCategory} categories={categories}
            material={material} onMaterial={setMaterial} materials={materials}
            size={size} onSize={setSize} sizes={sizes}
            maxPrice={maxPrice} onMaxPrice={setMaxPrice}
            stockOnly={stockOnly} onStockOnly={setStockOnly}
          />
        </aside>

        <div>
          <div className="mb-5 grid gap-3">
            <div className="flex flex-wrap gap-2">
              <button className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${category === "all" ? "bg-ink text-kesar" : "glass-control"}`} onClick={() => setCategory("all")}>
                All
              </button>
              {categories.map((item) => (
                <button
                  key={item.id}
                  className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${category === item.id ? "bg-neem text-kesar" : "glass-control"}`}
                  onClick={() => setCategory(item.id)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
          <div className="glass-card mb-6 flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
            <p className="text-sm font-bold">{filteredProducts.length} products selected</p>
            <div className="flex items-center gap-2">
              <button
                className="glass-control relative flex h-10 items-center gap-2 px-3 text-sm font-bold lg:hidden"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <Filter size={16} /> Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-gulal text-[9px] font-black text-ink">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <label className="flex items-center gap-2 text-sm font-bold">
                <SlidersHorizontal size={17} />
                <select className="glass-control h-10 px-3 text-sm outline-none" value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                  <option value="newest">Newest</option>
                </select>
              </label>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <BottomNav count={activeProducts.length} />

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setMobileFiltersOpen(false)}>
          <div
            className="fixed inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[28px] bg-[#fffdf1] pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-textile"
            onClick={(event) => event.stopPropagation()}
          >
            <StitchDivider tone="text-neem/40" className="pt-4" />
            <div className="flex items-center justify-between px-5 pb-2 pt-3">
              <h2 className="font-display text-2xl font-bold">Filters</h2>
              <button aria-label="Close filters" className="grid size-9 place-items-center rounded-full border border-black/15" onClick={() => setMobileFiltersOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="px-5 pb-2">
              <FilterFields
                query={query} onQuery={setQuery}
                category={category} onCategory={setCategory} categories={categories}
                material={material} onMaterial={setMaterial} materials={materials}
                size={size} onSize={setSize} sizes={sizes}
                maxPrice={maxPrice} onMaxPrice={setMaxPrice}
                stockOnly={stockOnly} onStockOnly={setStockOnly}
              />
            </div>
            <div className="p-5 pt-3">
              <button
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-black uppercase tracking-[0.16em] text-kesar"
                onClick={() => setMobileFiltersOpen(false)}
              >
                Show {filteredProducts.length} pieces
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function FilterFields({
  query, onQuery,
  category, onCategory, categories,
  material, onMaterial, materials,
  size, onSize, sizes,
  maxPrice, onMaxPrice,
  stockOnly, onStockOnly,
}: {
  query: string; onQuery: (value: string) => void;
  category: string; onCategory: (value: string) => void; categories: Category[];
  material: string; onMaterial: (value: string) => void; materials: string[];
  size: string; onSize: (value: string) => void; sizes: string[];
  maxPrice: number; onMaxPrice: (value: number) => void;
  stockOnly: boolean; onStockOnly: (value: boolean) => void;
}) {
  return (
    <div className="grid gap-4">
      <label className="grid gap-2 text-sm font-bold">
        Search
        <span className="glass-control flex h-11 items-center gap-2 px-3">
          <Search size={16} />
          <input className="w-full bg-transparent text-sm outline-none" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="shirt, teal, silk" />
        </span>
      </label>
      <FilterSelect label="Category" value={category} onChange={onCategory} options={[["all", "All categories"], ...categories.map((item) => [item.id, item.name] as [string, string])]} />
      <FilterSelect label="Material" value={material} onChange={onMaterial} options={[["all", "All materials"], ...materials.map((item) => [item, item] as [string, string])]} />
      <FilterSelect label="Size" value={size} onChange={onSize} options={[["all", "All sizes"], ...sizes.map((item) => [item, item] as [string, string])]} />
      <label className="grid gap-2 text-sm font-bold">
        Max price: ₹{maxPrice.toLocaleString("en-IN")}
        <input type="range" min="1000" max="12000" step="500" value={maxPrice} onChange={(event) => onMaxPrice(Number(event.target.value))} />
      </label>
      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" checked={stockOnly} onChange={(event) => onStockOnly(event.target.checked)} />
        In stock only
      </label>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <select className="glass-control h-11 px-3 text-sm outline-none" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
