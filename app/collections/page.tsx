"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StoreHeader } from "@/components/StoreHeader";
import { firebaseReady, subscribeCategories, subscribeProducts } from "@/lib/firebase";
import { categories as seedCategories, products as seedProducts, type Category, type Product } from "@/lib/products";

export default function CollectionsPage() {
  const [categories, setCategories] = useState<Category[]>(seedCategories);
  const [products, setProducts] = useState<Product[]>(seedProducts);

  useEffect(() => {
    if (!firebaseReady) return;
    const unsubscribeCategories = subscribeCategories((items) => items.length && setCategories(items));
    const unsubscribeProducts = subscribeProducts((items) => items.length && setProducts(items));
    return () => {
      unsubscribeCategories();
      unsubscribeProducts();
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#fffdf1] text-ink">
      <StoreHeader count={products.filter((product) => product.status === "active").length} />
      <section className="mx-auto max-w-[1500px] px-4 pb-20 pt-36 sm:px-6 lg:px-10">
        <p className="text-xs font-black uppercase tracking-[0.26em] text-gulal">Collections</p>
        <h1 className="mt-3 font-display text-7xl font-bold leading-none tracking-normal">Shop by story.</h1>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {categories.map((category, index) => (
            <Link key={category.id} href={`/shop?category=${category.id}`} className={`${index % 2 ? "bg-gulal" : "bg-neem text-[#fffdf1]"} glass-border min-h-96 p-6`}>
              <p className="text-xs font-black uppercase tracking-[0.24em] opacity-70">0{index + 1}</p>
              <h2 className="mt-32 font-display text-5xl font-bold leading-none tracking-normal">{category.name}</h2>
              <p className="mt-4 max-w-sm text-sm leading-7 opacity-75">{category.description}</p>
              <span className="mt-8 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em]">
                View collection <ArrowRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
