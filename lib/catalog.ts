import type { Category, Product } from "./products";

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

export function productPhoto(product: Product) {
  return product.images?.[0] ?? product.photo;
}

export function productPhotos(product: Product) {
  if (product.images?.length) return product.images;
  return product.photo ? [product.photo] : [];
}

export function hasPhoto(product: Product) {
  return Boolean(productPhoto(product));
}

export function productImageStyle(product: Product) {
  const photo = productPhoto(product);
  return photo ? { backgroundImage: `url(${photo})` } : { background: product.image };
}

/** Prefers an admin-uploaded category video; falls back to an explicit cover
 * photo, then the given product's photo (typically the category's featured item). */
export function categoryMedia(category: Category, fallbackPhoto?: string) {
  if (category.videoUrl) return { type: "video" as const, src: category.videoUrl };
  const photo = category.coverPhoto ?? fallbackPhoto;
  return photo ? { type: "photo" as const, src: photo } : null;
}
