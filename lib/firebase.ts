import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type ConfirmationResult,
  type User,
} from "firebase/auth";
import { get, getDatabase, onValue, ref, remove, serverTimestamp, set, update } from "firebase/database";
import { getDownloadURL, getStorage, ref as storageRef, uploadBytes } from "firebase/storage";
import type { Campaign, Category, Product } from "./products";
import type { CartItem, CommerceOrder } from "./commerce";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const firebaseReady = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.databaseURL &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

export const app = firebaseReady
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const auth = app ? getAuth(app) : null;
export const database = app ? getDatabase(app) : null;
export const googleProvider = new GoogleAuthProvider();
export type UserRole = "customer" | "admin";
export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  phone: string;
  provider: string;
  role: UserRole;
  createdAt: number | object;
  updatedAt: number | object;
};

export async function ensureUserProfile(user: User) {
  if (!database) return null;
  const userRef = ref(database, `users/${user.uid}`);
  const snapshot = await get(userRef);
  const existing = snapshot.val() as UserProfile | null;
  // The client never grants itself a role; admins are made with `npm run admin:grant`.
  const role = existing?.role ?? "customer";
  const profile = {
    uid: user.uid,
    name: user.displayName ?? existing?.name ?? "BAAGAY customer",
    email: user.email ?? existing?.email ?? "",
    phone: user.phoneNumber ?? existing?.phone ?? "",
    provider: user.providerData[0]?.providerId ?? existing?.provider ?? "unknown",
    role,
    createdAt: existing?.createdAt ?? serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await set(userRef, profile);
  return { ...profile, createdAt: existing?.createdAt ?? Date.now(), updatedAt: Date.now() } as UserProfile;
}

export async function getUserRole(uid: string): Promise<UserRole | null> {
  if (!database) return null;
  const snapshot = await get(ref(database, `users/${uid}/role`));
  const role = snapshot.val();
  return role === "admin" || role === "customer" ? role : null;
}

/** Matches the database rules and API routes: the `admin` custom claim or
 * `users/{uid}/role === "admin"`. */
export async function isAdminUser(user: User) {
  const token = await user.getIdTokenResult();
  if (token.claims.admin === true) return true;
  return (await getUserRole(user.uid)) === "admin";
}

export async function registerWithEmail(name: string, email: string, password: string) {
  if (!auth || !database) throw new Error("Firebase is not configured.");
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  await saveRegistration({
    uid: credential.user.uid,
    name,
    email,
    provider: "email",
  });
  await ensureUserProfile(credential.user);
  return credential.user;
}

export async function loginWithEmail(email: string, password: string) {
  if (!auth) throw new Error("Firebase is not configured.");
  return signInWithEmailAndPassword(auth, email, password);
}

export async function loginWithGoogle() {
  if (!auth) throw new Error("Firebase is not configured.");
  const credential = await signInWithPopup(auth, googleProvider);
  await saveRegistration({
    uid: credential.user.uid,
    name: credential.user.displayName ?? "Google customer",
    email: credential.user.email ?? "",
    provider: "google",
  });
  await ensureUserProfile(credential.user);
  return credential.user;
}

export function makeRecaptcha(containerId: string) {
  if (!auth) throw new Error("Firebase is not configured.");
  return new RecaptchaVerifier(auth, containerId, { size: "invisible" });
}

export async function sendPhoneOtp(phone: string, verifier: RecaptchaVerifier) {
  if (!auth) throw new Error("Firebase is not configured.");
  return signInWithPhoneNumber(auth, phone, verifier);
}

export async function confirmPhoneOtp(result: ConfirmationResult, code: string, name: string) {
  const credential = await result.confirm(code);
  await saveRegistration({
    uid: credential.user.uid,
    name,
    phone: credential.user.phoneNumber ?? "",
    provider: "phone",
  });
  await ensureUserProfile(credential.user);
  return credential.user;
}

export async function saveRegistration(data: {
  uid: string;
  name: string;
  email?: string;
  phone?: string;
  provider: "email" | "google" | "phone";
}) {
  if (!database) throw new Error("Firebase is not configured.");
  await set(ref(database, `registrations/${data.uid}`), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function saveWishlistLead(data: {
  name: string;
  email: string;
  product: string;
  note?: string;
}) {
  const response = await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Could not save request.");
}

export async function saveNewsletterSubscription(email: string) {
  const response = await fetch("/api/newsletter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Could not subscribe.");
}

export async function loadUserCommerce(uid: string) {
  if (!database) return { cart: [] as CartItem[], wishlist: [] as string[], cloudAvailable: false };
  const [cartResult, wishlistResult] = await Promise.allSettled([
    get(ref(database, `userCarts/${uid}`)),
    get(ref(database, `userWishlists/${uid}`)),
  ]);
  return {
    cart: cartResult.status === "fulfilled" && Array.isArray(cartResult.value.val()) ? cartResult.value.val() as CartItem[] : [],
    wishlist: wishlistResult.status === "fulfilled" && Array.isArray(wishlistResult.value.val()) ? wishlistResult.value.val() as string[] : [],
    cloudAvailable: cartResult.status === "fulfilled" && wishlistResult.status === "fulfilled",
  };
}

export async function saveUserCart(uid: string, cart: CartItem[]) {
  if (!database) return;
  await set(ref(database, `userCarts/${uid}`), cart);
}

export async function saveUserWishlist(uid: string, wishlist: string[]) {
  if (!database) return;
  await set(ref(database, `userWishlists/${uid}`), wishlist);
}

function valuesFromSnapshot<T>(value: unknown): T[] {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value as Record<string, T>).map(([id, item]) => ({
    ...item,
    id,
  }));
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)).filter((item) => item !== undefined) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, stripUndefined(item)]),
    ) as T;
  }

  return value;
}

export function subscribeProducts(callback: (items: Product[]) => void) {
  if (!database) return () => undefined;
  return onValue(ref(database, "catalog/products"), (snapshot) => {
    callback(valuesFromSnapshot<Product>(snapshot.val()));
  });
}

export function subscribeCategories(callback: (items: Category[]) => void) {
  if (!database) return () => undefined;
  return onValue(ref(database, "catalog/categories"), (snapshot) => {
    callback(valuesFromSnapshot<Category>(snapshot.val()));
  });
}

export function subscribeCampaigns(callback: (items: Campaign[]) => void) {
  if (!database) return () => undefined;
  return onValue(ref(database, "catalog/campaigns"), (snapshot) => {
    callback(valuesFromSnapshot<Campaign>(snapshot.val()));
  });
}

export function subscribeOrders(callback: (items: CommerceOrder[]) => void) {
  if (!database || !auth?.currentUser) return () => undefined;
  return onValue(ref(database, "orders"), (snapshot) => callback(valuesFromSnapshot<CommerceOrder>(snapshot.val()).sort((a, b) => b.createdAt - a.createdAt)));
}

export async function getProduct(productId: string) {
  if (!database) throw new Error("Firebase is not configured.");
  return (await get(ref(database, `catalog/products/${productId}`))).val() as Product | null;
}

export async function upsertProduct(product: Product) {
  if (!database) throw new Error("Firebase is not configured.");
  await set(ref(database, `catalog/products/${product.id}`), {
    ...stripUndefined(product),
    createdAt: product.createdAt ?? serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

const OPTIONAL_PRODUCT_FIELDS = ["salePrice", "subcategory", "description", "details", "care", "photo", "images"] as const;

/** Saves everything about an existing product except its stock, which only moves
 * through `adjustStock` so it cannot overwrite holds placed by live checkouts.
 * Cleared optional fields are removed. */
export async function saveProductDetails(product: Product) {
  if (!database) throw new Error("Firebase is not configured.");
  const details: Partial<Product> = { ...product };
  delete details.inventory;
  delete details.sizeInventory;
  delete details.createdAt;
  const cleared: Record<string, null> = {};
  for (const key of OPTIONAL_PRODUCT_FIELDS) {
    const value = details[key];
    if (value === undefined || value === "" || (Array.isArray(value) && !value.length)) {
      cleared[key] = null;
      delete details[key];
    }
  }
  await update(ref(database, `catalog/products/${product.id}`), {
    ...cleared,
    ...stripUndefined(details),
    updatedAt: serverTimestamp(),
  });
}

export type StockLine = { size?: string; delta: number };

/** Relative stock change, applied transactionally on the server. */
export async function adjustStock(productId: string, lines: StockLine[]) {
  const token = await auth?.currentUser?.getIdToken();
  const response = await fetch(`/api/admin/products/${encodeURIComponent(productId)}/stock`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ lines }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Stock update failed.");
}

/** Pushes seed records only where nothing exists yet, so re-seeding never
 * resets live stock, prices, or edits. Returns how many records were created. */
export async function seedMissingCatalog(seed: { products: Product[]; categories: Category[]; campaigns: Campaign[] }) {
  if (!database) throw new Error("Firebase is not configured.");
  const db = database;
  const [products, categories, campaigns] = await Promise.all(["products", "categories", "campaigns"].map(async (path) => (await get(ref(db, `catalog/${path}`))).val() ?? {})) as Record<string, unknown>[];
  const writes = [
    ...seed.categories.filter((item) => !categories[item.id]).map((item) => upsertCategory(item)),
    ...seed.products.filter((item) => !products[item.id]).map((item) => upsertProduct(item)),
    ...seed.campaigns.filter((item) => !campaigns[item.id]).map((item) => upsertCampaign(item)),
  ];
  await Promise.all(writes);
  return writes.length;
}

export async function patchProduct(productId: string, data: Partial<Product>) {
  if (!database) throw new Error("Firebase is not configured.");
  await update(ref(database, `catalog/products/${productId}`), {
    ...stripUndefined(data),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(productId: string) {
  if (!database) throw new Error("Firebase is not configured.");
  await remove(ref(database, `catalog/products/${productId}`));
}

export async function upsertCategory(category: Category) {
  if (!database) throw new Error("Firebase is not configured.");
  await set(ref(database, `catalog/categories/${category.id}`), {
    ...category,
    updatedAt: serverTimestamp(),
  });
}

/** Uploads a category video (or cover photo) straight to Cloud Storage and
 * returns its download URL; the database stores only that URL. Requires the
 * `admin` custom claim (granted with `npm run admin:grant`). */
export async function uploadCategoryMedia(categoryId: string, file: File) {
  if (!app || !auth?.currentUser) throw new Error("Sign in as an admin first.");
  if (!/^(video|image)\//.test(file.type)) throw new Error("Choose a video or image file.");
  if (file.size > 50 * 1024 * 1024) throw new Error("Files must be under 50 MB. Compress the video first.");
  const token = await auth.currentUser.getIdTokenResult(true);
  if (token.claims.admin !== true) throw new Error("Uploading videos needs the admin claim. Run `npm run admin:grant -- your@email`, then sign out and back in.");
  const safe = (categoryId || "unsorted").replace(/[^a-z0-9-]/gi, "") || "unsorted";
  const extension = file.name.split(".").pop()?.toLowerCase() || file.type.split("/")[1];
  const target = storageRef(getStorage(app), `categories/${safe}/${Date.now()}.${extension}`);
  await uploadBytes(target, file, { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" });
  return getDownloadURL(target);
}

export async function deleteCategory(categoryId: string) {
  if (!database) throw new Error("Firebase is not configured.");
  await remove(ref(database, `catalog/categories/${categoryId}`));
}

export async function upsertCampaign(campaign: Campaign) {
  if (!database) throw new Error("Firebase is not configured.");
  await set(ref(database, `catalog/campaigns/${campaign.id}`), {
    ...campaign,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCampaign(campaignId: string) {
  if (!database) throw new Error("Firebase is not configured.");
  await remove(ref(database, `catalog/campaigns/${campaignId}`));
}
