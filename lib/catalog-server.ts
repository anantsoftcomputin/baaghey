import { unstable_cache } from "next/cache";
import { adminDatabase } from "@/lib/firebase-admin";
import { campaigns as seedCampaigns, categories as seedCategories, products as seedProducts, type Campaign, type Category, type Product } from "@/lib/products";
import { effectivePrice, findCampaign, orderTotals, type CartItem } from "@/lib/commerce";
import { productPhoto, productSlug } from "@/lib/catalog";

/** Realtime Database reads wait indefinitely when credentials are broken, which
 * would hang every page render and the build. Give up after a few seconds. */
function withTimeout<T>(promise: Promise<T>, ms = 15000) {
  return Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Firebase read timed out after ${ms} ms`)), ms))]);
}

/** Live catalog when Firebase Admin is configured, otherwise the seed catalog. */
export async function serverProducts(): Promise<Product[]> {
  if (!adminDatabase) return seedProducts;
  try {
    const remote = (await withTimeout(adminDatabase.ref("catalog/products").get())).val() as Record<string, Product> | null;
    return remote ? Object.entries(remote).map(([id, product]) => ({ ...product, id })) : seedProducts;
  } catch (error) {
    console.error("Could not read catalog; using seed products", error);
    return seedProducts;
  }
}

/** Live categories when Firebase Admin is configured, otherwise the seed list. */
export async function serverCategories(): Promise<Category[]> {
  if (!adminDatabase) return seedCategories;
  try {
    const remote = (await withTimeout(adminDatabase.ref("catalog/categories").get())).val() as Record<string, Category> | null;
    return remote ? Object.entries(remote).map(([id, category]) => ({ ...category, id })) : seedCategories;
  } catch (error) {
    console.error("Could not read categories; using seed categories", error);
    return seedCategories;
  }
}

const notEmbedded = (src?: string) => (src && !src.startsWith("data:") ? src : undefined);

/** Catalog sent with every page so the first paint already shows live data.
 * Embedded data URLs are dropped so they never bloat the HTML. */
export const catalogSnapshot = unstable_cache(
  async () => {
    const [products, categories] = await Promise.all([serverProducts(), serverCategories()]);
    return {
      products: products.map((product) => ({ ...product, photo: notEmbedded(product.photo), images: product.images?.filter((src) => !src.startsWith("data:")) })),
      categories: categories.map((category) => ({ ...category, videoUrl: notEmbedded(category.videoUrl), coverPhoto: notEmbedded(category.coverPhoto) })),
    };
  },
  ["catalog-snapshot"],
  { revalidate: 300 },
);

export async function serverCampaigns(): Promise<Campaign[]> {
  if (!adminDatabase) return seedCampaigns;
  const remote = (await withTimeout(adminDatabase.ref("catalog/campaigns").get())).val() as Record<string, Campaign> | null;
  return remote ? Object.values(remote) : [];
}

export type RequestedLine = Pick<CartItem, "productId" | "size" | "quantity">;

/** Rebuilds the bag from trusted catalog data; browser prices are never used. */
export async function priceBag(requested: RequestedLine[], coupon?: string) {
  if (!requested?.length || requested.length > 20) return { error: "Your bag is empty or too large.", status: 400 } as const;
  const catalog = await serverProducts();
  const items: CartItem[] = [];
  for (const line of requested) {
    const product = catalog.find((item) => item.id === line.productId && item.status === "active");
    const quantity = Math.floor(Number(line.quantity));
    const available = product?.sizeInventory?.[line.size] ?? product?.inventory ?? 0;
    if (!product || quantity < 1 || quantity > 10 || !product.sizes.includes(line.size) || available < quantity) {
      return { error: `${product?.name ?? "One of your pieces"} is no longer available in that size and quantity. Refresh your bag and try again.`, status: 409 } as const;
    }
    const photo = productPhoto(product);
    items.push({ productId: product.id, category: product.category, name: product.name, slug: productSlug(product), ...(photo && !photo.startsWith("data:") ? { photo } : {}), size: line.size, price: effectivePrice(product), quantity });
  }
  const code = coupon?.trim();
  const campaign = code ? findCampaign(await serverCampaigns(), code) : null;
  if (code && !campaign) return { error: "That promotion code is invalid or has expired.", status: 400 } as const;
  return { items, campaign, ...orderTotals(items, campaign) };
}
