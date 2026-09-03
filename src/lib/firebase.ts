import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
} from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  type Auth,
} from "firebase/auth";

const isBrowser = typeof window !== "undefined";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Firebase Auth is a browser service in this application. Next.js can
 * prerender client components on the server, so never initialize the browser
 * Auth SDK during that server pass. This prevents a missing/misconfigured
 * NEXT_PUBLIC_FIREBASE_API_KEY from crashing the entire production build.
 */
const app: FirebaseApp | null = isBrowser
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const auth: Auth = app
  ? getAuth(app)
  : (null as unknown as Auth);

export const googleProvider: GoogleAuthProvider = isBrowser
  ? new GoogleAuthProvider()
  : (null as unknown as GoogleAuthProvider);

if (isBrowser) {
  googleProvider.setCustomParameters({
    prompt: "select_account",
  });
}

export default app;
