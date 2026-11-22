import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const email = process.argv[2];
if (!email) throw new Error("Usage: npm run admin:grant -- admin@example.com");
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const hasInlineCredentials = Boolean(process.env.FIREBASE_ADMIN_PROJECT_ID && process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY);
const hasCredentialsFile = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);

if (!projectId || (!hasInlineCredentials && !hasCredentialsFile)) {
  throw new Error(
    "Firebase Admin credentials are missing. Download a service-account JSON from Firebase Console → Project Settings → Service Accounts, then add GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json to .env.local.",
  );
}

const credential = hasCredentialsFile
  ? applicationDefault()
  : cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    });

const app = initializeApp({ credential, projectId });
const auth = getAuth(app);
const user = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(user.uid, { ...user.customClaims, admin: true });
console.log(`Granted BAAGAY admin access to ${email}. Ask the user to sign out and back in.`);
