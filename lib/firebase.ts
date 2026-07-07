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
} from "firebase/auth";
import { getDatabase, onValue, push, ref, remove, serverTimestamp, set, update } from "firebase/database";
import type { Campaign, Category, Product } from "./products";

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
  if (!database) throw new Error("Firebase is not configured.");
  await push(ref(database, "wishlistLeads"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function saveImageRecord(data: {
  productId: string;
  fileName: string;
  dataUrl: string;
}) {
  if (!database) throw new Error("Firebase is not configured.");
  await push(ref(database, `productImages/${data.productId}`), {
    fileName: data.fileName,
    dataUrl: data.dataUrl,
    createdAt: serverTimestamp(),
  });
}

function valuesFromSnapshot<T>(value: unknown): T[] {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value as Record<string, T>).map(([id, item]) => ({
    ...item,
    id,
  }));
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

export async function upsertProduct(product: Product) {
  if (!database) throw new Error("Firebase is not configured.");
  await set(ref(database, `catalog/products/${product.id}`), {
    ...product,
    updatedAt: serverTimestamp(),
  });
}

export async function patchProduct(productId: string, data: Partial<Product>) {
  if (!database) throw new Error("Firebase is not configured.");
  await update(ref(database, `catalog/products/${productId}`), {
    ...data,
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
