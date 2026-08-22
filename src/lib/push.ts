function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function enablePushNotifications(userId: string) {
  if (!userId) {
    throw new Error("You must be signed in.");
  }

  if (!("Notification" in window)) {
    throw new Error("Push notifications are not supported by this browser.");
  }

  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported.");
  }

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!vapidKey) {
    throw new Error("VAPID public key is missing.");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Notification permission was denied.");
  }

  const registration = await navigator.serviceWorker.register("/sw.js");

  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
  }

  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      subscription: subscription.toJSON(),
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to save push subscription.");
  }

  return subscription;
}

export async function disablePushNotifications(userId: string) {
  const registration = await navigator.serviceWorker.getRegistration("/");

  const subscription = await registration?.pushManager.getSubscription();

  if (subscription) {
    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        endpoint: subscription.endpoint,
      }),
    });

    await subscription.unsubscribe();
  }
}
