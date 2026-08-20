import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

/**
 * Firebase is OPTIONAL. When NEXT_PUBLIC_FIREBASE_API_KEY is not set,
 * the app falls back to direct backend-only authentication
 * (POST /api/v1/auth/login + GET /api/v1/auth/lookup).
 */
export const isFirebaseConfigured = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

let auth: Auth | null = null;

if (isFirebaseConfigured) {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
}

export { auth };
