import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { getStorage } from "firebase-admin/storage";

function privateKey() {
  return process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const hasInlineCredentials = Boolean(process.env.FIREBASE_ADMIN_PROJECT_ID && process.env.FIREBASE_ADMIN_CLIENT_EMAIL && privateKey());
const hasCredentialsFile = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);

export const firebaseAdminReady = Boolean(projectId && (hasInlineCredentials || hasCredentialsFile) && process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL);

let adminApp: App | null = null;

if (firebaseAdminReady) {
  const credential = hasCredentialsFile
    ? applicationDefault()
    : cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: privateKey(),
      });
  adminApp = getApps()[0] ?? initializeApp({
    credential,
    projectId,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
}

export const adminAuth = adminApp ? getAuth(adminApp) : null;
export const adminDatabase = adminApp ? getDatabase(adminApp) : null;

const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
export const adminBucket = adminApp && storageBucket ? getStorage(adminApp).bucket(storageBucket) : null;

export async function userFromRequest(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || !adminAuth) return null;
  try {
    return await adminAuth.verifyIdToken(token);
  } catch {
    return null;
  }
}

/** Admins are recognised the same way the database rules recognise them:
 * by the `admin` custom claim or by `users/{uid}/role === "admin"`. */
export async function adminFromRequest(request: Request) {
  const user = await userFromRequest(request);
  if (!user) return null;
  if (user.admin === true) return user;
  if (!adminDatabase) return null;
  const role = (await adminDatabase.ref(`users/${user.uid}/role`).get()).val();
  return role === "admin" ? user : null;
}
