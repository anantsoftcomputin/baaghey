import { NextResponse } from "next/server";
import { adminDatabase, adminFromRequest } from "@/lib/firebase-admin";
import { decodeDataUrl, storeCategoryMedia, storeProductImage } from "@/lib/media-server";
import type { Category, Product } from "@/lib/products";

export const maxDuration = 300;

/** One-off move of photos and videos embedded as data URLs into Cloud Storage.
 * Embedded media makes every shopper download it with the catalog. */
export async function POST(request: Request) {
  if (!(await adminFromRequest(request))) return NextResponse.json({ error: "Admin permission required." }, { status: 403 });
  if (!adminDatabase) return NextResponse.json({ error: "Firebase Admin is not configured." }, { status: 503 });
  try {
    let moved = 0;

    const products = ((await adminDatabase.ref("catalog/products").get()).val() ?? {}) as Record<string, Product>;
    for (const [id, product] of Object.entries(products)) {
      const sources = product.images?.length ? product.images : product.photo ? [product.photo] : [];
      if (!sources.some((src) => src.startsWith("data:"))) continue;
      const images: string[] = [];
      for (const src of sources) {
        const decoded = decodeDataUrl(src);
        if (!decoded) { images.push(src); continue; }
        images.push(await storeProductImage(decoded.data, decoded.contentType, id));
        moved += 1;
      }
      await adminDatabase.ref(`catalog/products/${id}`).update({ images, photo: images[0], updatedAt: Date.now() });
    }

    const categories = ((await adminDatabase.ref("catalog/categories").get()).val() ?? {}) as Record<string, Category>;
    for (const [id, category] of Object.entries(categories)) {
      const patch: Partial<Category> = {};
      for (const key of ["videoUrl", "coverPhoto"] as const) {
        const decoded = category[key]?.startsWith("data:") ? decodeDataUrl(category[key]!) : null;
        if (!decoded) continue;
        patch[key] = await storeCategoryMedia(decoded.data, decoded.contentType, id);
        moved += 1;
      }
      if (Object.keys(patch).length) await adminDatabase.ref(`catalog/categories/${id}`).update({ ...patch, updatedAt: Date.now() });
    }

    return NextResponse.json({ ok: true, moved });
  } catch (error) {
    console.error("Media migration failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Migration failed." }, { status: 500 });
  }
}
