import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import app from "@/lib/firebase";

export async function requestPushPermission() {
  if (typeof window === "undefined") return null;

  const supported = await isSupported();
  if (!supported || !("Notification" in window)) return null;

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    return null;
  }

  const messaging = getMessaging(app);

  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
  });

  return token;
}

export async function listenForMessages(
  callback: (payload: unknown) => void
) {
  if (typeof window === "undefined") return () => {};

  const supported = await isSupported();
  if (!supported) return () => {};

  const messaging = getMessaging(app);

  return onMessage(messaging, callback);
}
