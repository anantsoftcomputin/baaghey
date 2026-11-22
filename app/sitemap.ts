import type { MetadataRoute } from "next";
import { productSlug } from "@/lib/catalog";
import { serverProducts } from "@/lib/catalog-server";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const pages = ["", "/shop", "/collections", "/journal", "/privacy-policy", "/refund-policy", "/user-agreement"];
  const products = (await serverProducts()).filter((product) => product.status === "active");
  return [
    ...pages.map((path) => ({ url: `${base}${path}`, changeFrequency: path === "" ? "weekly" as const : "monthly" as const, priority: path === "" ? 1 : 0.7 })),
    ...products.map((product) => ({ url: `${base}/products/${productSlug(product)}`, lastModified: product.updatedAt ? new Date(product.updatedAt) : undefined, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
