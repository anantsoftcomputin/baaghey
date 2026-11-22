"use client";

import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { firebaseReady, subscribeProducts } from "@/lib/firebase";
import { categories as seedCategories, products as seedProducts, type Category, type Product } from "@/lib/products";

export type Promotion = { code: string; name: string; discountPercent: number };
export type CatalogSnapshot = { products: Product[]; categories: Category[] };

type CatalogValue = { products: Product[]; activeProducts: Product[]; categories: Category[]; promotion: Promotion | null; ready: boolean };

const CatalogContext = createContext<CatalogValue | null>(null);

/** Holds the one live catalog subscription for the whole app. It starts from the
 * server's snapshot (so the first paint is already the live catalog, not the
 * seed) and then follows products in real time. Categories come only from the
 * server snapshot (refreshed every few minutes): they rarely change, and a live
 * subscription would download any media embedded in them on every page. An
 * empty database falls back to the seed catalog, as the server does. */
export function CatalogProvider({ initial, children }: { initial?: CatalogSnapshot; children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initial?.products.length ? initial.products : seedProducts);
  const categories = initial?.categories.length ? initial.categories : seedCategories;
  const [productsReady, setProductsReady] = useState(!firebaseReady);
  const [promotion, setPromotion] = useState<Promotion | null>(null);

  useEffect(() => {
    if (!firebaseReady) return;
    return subscribeProducts((items) => {
      setProducts(items.length ? items : seedProducts);
      setProductsReady(true);
    });
  }, []);

  useEffect(() => {
    let live = true;
    fetch("/api/promotion")
      .then((response) => (response.ok ? response.json() : { promotion: null }))
      .then((data: { promotion: Promotion | null }) => { if (live) setPromotion(data.promotion); })
      .catch(() => undefined);
    return () => { live = false; };
  }, []);

  const value = useMemo<CatalogValue>(() => ({
    products,
    activeProducts: products.filter((product) => product.status === "active"),
    categories,
    promotion,
    ready: productsReady,
  }), [categories, products, productsReady, promotion]);

  return createElement(CatalogContext.Provider, { value }, children);
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error("useCatalog must be used within CatalogProvider");
  return context;
}
