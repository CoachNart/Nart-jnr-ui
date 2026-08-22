"use client";

import { useState } from "react";
import { requestPushPermission } from "@/lib/messaging";

export default function PushNotifications() {
  const [status, setStatus] = useState("Enable alerts");

  async function enableNotifications() {
    setStatus("Enabling...");

    try {
      const token = await requestPushPermission();

      if (token) {
        setStatus("Alerts enabled");
      } else {
        setStatus("Enable alerts");
      }
    } catch (error) {
      console.error("Push notification error:", error);
      setStatus("Try again");
    }
  }

  return (
    <button
      onClick={enableNotifications}
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
