import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD0zh8SNjsYlOJRN73DSr8nssq1J8Wf71A",
  authDomain: "kitsetups.firebaseapp.com",
  projectId: "kitsetups",
  storageBucket: "kitsetups.firebasestorage.app",
  messagingSenderId: "350160391761",
  appId: "1:350160391761:web:141cb0356927f7379a3270",
  measurementId: "G-X2E4TVQ8QR",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export async function initAnalytics() {
  if (typeof window === "undefined") return null;

  if (await isSupported()) {
    return getAnalytics(app);
  }

  return null;
}

export default app;
