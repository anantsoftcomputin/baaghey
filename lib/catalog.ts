import type { Product } from "./products";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function productSlug(product: Product) {
  return product.id || slugify(product.name);
}

export function productHref(product: Product) {
  return `/products/${productSlug(product)}`;
}

export function formatPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`;
}

export function productImageStyle(product: Product) {
  return product.imageDataUrl
    ? { backgroundImage: `url(${product.imageDataUrl})` }
    : { background: product.image };
}
