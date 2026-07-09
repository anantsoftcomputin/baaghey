"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { StoreHeader } from "@/components/StoreHeader";
import { BottomNav } from "@/components/BottomNav";
import { SiteFooter } from "@/components/SiteFooter";
import { firebaseReady, subscribeCategories, subscribeProducts } from "@/lib/firebase";
import { categories as seedCategories, products as seedProducts, type Category, type Product } from "@/lib/products";

type SortMode = "featured" | "price-low" | "price-high" | "newest";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [categories, setCategories] = useState<Category[]>(seedCategories);
  const [category, setCategory] = useState("all");
  const [subcategory, setSubcategory] = useState("all");
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
    const nextSubcategory = params.get("subcategory");
    if (nextCategory) setCategory(nextCategory);
    if (nextSubcategory) setSubcategory(nextSubcategory);
  }, []);

  const activeProducts = products.filter((product) => product.status === "active");
  const materials = Array.from(new Set(activeProducts.map((product) => product.material))).sort();
  const sizes = Array.from(new Set(activeProducts.flatMap((product) => product.sizes))).sort();
  const activeCategory = categories.find((item) => item.id === category);
  const activeFilterCount = [category !== "all", subcategory !== "all", material !== "all", size !== "all", stockOnly, maxPrice < 10000].filter(Boolean).length;

  const filteredProducts = useMemo(() => {
    const list = activeProducts
      .filter((product) => category === "all" || product.category === category)
      .filter((product) => subcategory === "all" || product.subcategory === subcategory)
      .filter((product) => material === "all" || product.material === material)
      .filter((product) => size === "all" || product.sizes.includes(size))
      .filter((product) => !stockOnly || product.inventory > 0)
      .filter((product) => (product.salePrice ?? product.price) <= maxPrice);

    return list.sort((a, b) => {
      if (sort === "price-low") return (a.salePrice ?? a.price) - (b.salePrice ?? b.price);
      if (sort === "price-high") return (b.salePrice ?? b.price) - (a.salePrice ?? a.price);
      if (sort === "newest") return b.id.localeCompare(a.id);
      return Number(b.featured) - Number(a.featured);
    });
  }, [activeProducts, category, subcategory, material, maxPrice, size, sort, stockOnly]);

  return (
    <main className="min-h-screen text-black">
      <StoreHeader count={activeProducts.length} />

      <section className="container-max px-4 pb-6 pt-28 sm:px-6 lg:px-10">
        <h1 className="text-4xl font-bold sm:text-5xl">Shop</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-mute">
          Modern hand-tied shirts, dresses, and layers — {activeProducts.length} pieces.
        </p>
      </section>

      <section className="container-max px-4 pb-3 sm:px-6 lg:px-10">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <button
            className={`h-9 shrink-0 border px-4 text-xs font-bold uppercase tracking-[0.06em] ${category === "all" ? "border-green bg-green text-white" : "border-line"}`}
            onClick={() => {
              setCategory("all");
              setSubcategory("all");
            }}
          >
            All
          </button>
          {categories.map((item) => (
            <button
              key={item.id}
              className={`h-9 shrink-0 border px-4 text-xs font-bold uppercase tracking-[0.06em] ${category === item.id ? "border-green bg-green text-white" : "border-line"}`}
              onClick={() => {
                setCategory(item.id);
                setSubcategory("all");
              }}
            >
              {item.name}
            </button>
          ))}
        </div>

        {(activeCategory?.subcategories?.length ?? 0) > 0 && (
          <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            <button
              className={`h-8 shrink-0 border px-3 text-xs font-semibold ${subcategory === "all" ? "border-green-dark text-green-dark" : "border-line text-mute"}`}
              onClick={() => setSubcategory("all")}
            >
              All {activeCategory!.name}
            </button>
            {activeCategory!.subcategories!.map((sub) => (
              <button
                key={sub.id}
                className={`h-8 shrink-0 border px-3 text-xs font-semibold ${subcategory === sub.id ? "border-green-dark text-green-dark" : "border-line text-mute"}`}
                onClick={() => setSubcategory(sub.id)}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}
      </section>

      <section id="products" className="container-max grid gap-8 px-4 pb-20 pt-3 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-10">
        <aside className="hidden h-fit lg:sticky lg:top-28 lg:block">
          <div className="mb-5 flex items-center justify-between border-b border-line pb-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.08em]">Filters</h2>
            <Filter size={16} />
          </div>
          <FilterFields
            material={material} onMaterial={setMaterial} materials={materials}
            size={size} onSize={setSize} sizes={sizes}
            maxPrice={maxPrice} onMaxPrice={setMaxPrice}
            stockOnly={stockOnly} onStockOnly={setStockOnly}
          />
        </aside>

        <div>
          <div className="mb-5 flex flex-col justify-between gap-3 border-b border-line pb-4 sm:flex-row sm:items-center">
            <p className="text-sm font-semibold">{filteredProducts.length} products</p>
            <div className="flex items-center gap-2">
              <button
                className="relative flex h-10 items-center gap-2 border border-line px-3 text-sm font-semibold lg:hidden"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <Filter size={16} /> Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-pink-dark text-[9px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal size={16} />
                <select className="h-10 border border-line px-3 text-sm outline-none" value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                  <option value="newest">Newest</option>
                </select>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />

      <BottomNav count={activeProducts.length} />

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setMobileFiltersOpen(false)}>
          <div
            className="fixed inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto bg-white pb-[calc(env(safe-area-inset-bottom)+16px)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-xl font-bold">Filters</h2>
              <button aria-label="Close filters" className="grid size-9 place-items-center border border-line" onClick={() => setMobileFiltersOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4">
              <FilterFields
                material={material} onMaterial={setMaterial} materials={materials}
                size={size} onSize={setSize} sizes={sizes}
                maxPrice={maxPrice} onMaxPrice={setMaxPrice}
                stockOnly={stockOnly} onStockOnly={setStockOnly}
              />
            </div>
            <div className="p-5 pt-0">
              <button
                className="flex h-12 w-full items-center justify-center gap-2 bg-green text-sm font-bold uppercase tracking-[0.1em] text-white"
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
  material, onMaterial, materials,
  size, onSize, sizes,
  maxPrice, onMaxPrice,
  stockOnly, onStockOnly,
}: {
  material: string; onMaterial: (value: string) => void; materials: string[];
  size: string; onSize: (value: string) => void; sizes: string[];
  maxPrice: number; onMaxPrice: (value: number) => void;
  stockOnly: boolean; onStockOnly: (value: boolean) => void;
}) {
  return (
    <div className="grid gap-4">
      <FilterSelect label="Material" value={material} onChange={onMaterial} options={[["all", "All materials"], ...materials.map((item) => [item, item] as [string, string])]} />
      <FilterSelect label="Size" value={size} onChange={onSize} options={[["all", "All sizes"], ...sizes.map((item) => [item, item] as [string, string])]} />
      <label className="grid gap-2 text-sm font-semibold">
        Max price: ₹{maxPrice.toLocaleString("en-IN")}
        <input type="range" min="1000" max="12000" step="500" value={maxPrice} onChange={(event) => onMaxPrice(Number(event.target.value))} />
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold">
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
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <select className="h-11 border border-line px-3 text-sm outline-none" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
