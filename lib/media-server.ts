import { randomUUID } from "crypto";
import { adminBucket } from "@/lib/firebase-admin";

const IMAGE_TYPES = new Set(["image/webp", "image/jpeg", "image/png"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

/** Stores a file in Cloud Storage and returns a long-lived download URL, so the
 * Realtime Database only ever holds a short string. */
async function storeMedia(data: Buffer, contentType: string, folder: string) {
  if (!adminBucket) throw new Error("Cloud Storage is not configured. Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET.");
  const token = randomUUID();
  const extension = contentType.split("/")[1];
  const path = `${folder}/${Date.now()}-${token.slice(0, 8)}.${extension}`;
  await adminBucket.file(path).save(data, {
    resumable: false,
    metadata: { contentType, cacheControl: "public, max-age=31536000, immutable", metadata: { firebaseStorageDownloadTokens: token } },
  });
  return `https://firebasestorage.googleapis.com/v0/b/${adminBucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

const safeId = (id: string) => id.replace(/[^a-z0-9-]/gi, "") || "unsorted";

export async function storeProductImage(data: Buffer, contentType: string, productId: string) {
  if (!IMAGE_TYPES.has(contentType)) throw new Error("Only WebP, JPEG and PNG images are supported.");
  if (data.byteLength > MAX_UPLOAD_BYTES) throw new Error("Image is larger than 4 MB.");
  return storeMedia(data, contentType, `products/${safeId(productId)}`);
}

/** Category cover photos and videos (used by the one-off migration; new videos
 * are uploaded from the admin straight to Storage). */
export async function storeCategoryMedia(data: Buffer, contentType: string, categoryId: string) {
  const video = VIDEO_TYPES.has(contentType);
  if (!video && !IMAGE_TYPES.has(contentType)) throw new Error("Unsupported category media type.");
  if (data.byteLength > (video ? MAX_VIDEO_BYTES : MAX_UPLOAD_BYTES)) throw new Error("Category media is too large.");
  return storeMedia(data, contentType, `categories/${safeId(categoryId)}`);
}

export function decodeDataUrl(value: string) {
  const match = /^data:((?:image|video)\/[a-z0-9.+-]+);base64,(.+)$/.exec(value);
  return match ? { contentType: match[1], data: Buffer.from(match[2], "base64") } : null;
}
