"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import {
  enablePushNotifications,
  disablePushNotifications,
} from "@/lib/push";

export default function PushNotifications() {
  const [status, setStatus] = useState("Enable alerts");
  const [enabled, setEnabled] = useState(false);

  async function enableNotifications() {
    setStatus("Enabling...");

    try {
      const user = auth.currentUser;

      if (!user) {
        setStatus("Sign in first");
        return;
      }

      await enablePushNotifications(user.uid);

      setEnabled(true);
      setStatus("Alerts enabled");
    } catch (error) {
      console.error("Push notification error:", error);

      setStatus(
        error instanceof Error
          ? error.message
          : "Could not enable alerts"
      );
    }
  }

  async function disableNotifications() {
    setStatus("Disabling...");

    try {
      const user = auth.currentUser;

      if (!user) {
        setStatus("Sign in first");
        return;
      }

      await disablePushNotifications(user.uid);

      setEnabled(false);
      setStatus("Alerts disabled");
    } catch (error) {
      console.error("Push disable error:", error);
      setStatus("Could not disable alerts");
    }
  }

  return (
    <button
      onClick={
        enabled
          ? disableNotifications
          : enableNotifications
      }
      className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.04] px-4 py-3 text-left transition hover:bg-cyan-400/[0.08]"
    >
      <p className="text-[8px] font-bold tracking-[0.16em] text-cyan-400/70">
        NOTIFICATIONS
      </p>

      <p className="mt-1 text-xs font-semibold text-zinc-300">
        {status}
      </p>
    </button>
  );
}
