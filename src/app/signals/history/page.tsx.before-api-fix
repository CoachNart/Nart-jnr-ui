"use client";

import { useEffect, useState } from "react";
import { getIdToken, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

type Signal = {
  signalId?: string;
  symbol?: string;
  direction?: string;
  status?: string;
  publishedAt?: string;
  lifecycle?: {
    status?: string;
    outcome?: string | null;
    entryHit?: boolean;
    entryHitAt?: string | null;
    stopLossHit?: boolean;
    stopLossHitAt?: string | null;
    closedAt?: string | null;
  };
};

export default function SignalHistoryPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;

      if (!user) {
        setSignals([]);
        setError("Please sign in to view signal history.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const token = await getIdToken(user);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_KITSETUPS_API}/api/signals/history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const payload = await response.json();

        if (!response.ok || !payload.ok) {
          throw new Error(
            payload.error || "Failed to load signal history",
          );
        }

        if (!cancelled) {
          setSignals(
            Array.isArray(payload.data?.signals)
              ? payload.data.signals
              : [],
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load signal history",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  function formatDate(value?: string | null) {
    if (!value) return "—";

    return new Date(value).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function lifecycle(signal: Signal) {
    return (
      signal.lifecycle?.status ||
      signal.lifecycle?.outcome ||
      signal.status ||
      "OPEN"
    );
  }

  return (
    <main className="min-h-screen bg-[#030506] px-4 pb-24 pt-24 text-zinc-100 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <p className="font-mono text-[9px] font-black tracking-[0.28em] text-cyan-400/70">
            KITSETUPS
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Signal Track Record
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
            Every published KitSetups signal, preserved from publication
            through its final lifecycle outcome.
          </p>
        </div>

        {loading && (
          <div className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-8 text-sm text-zinc-500">
            Loading signal history...
          </div>
        )}

        {error && !loading && (
          <div className="rounded-3xl border border-red-400/10 bg-red-400/[0.04] p-6 text-sm text-red-300/80">
            {error}
          </div>
        )}

        {!loading && !error && signals.length === 0 && (
          <div className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-10 text-center">
            <p className="font-mono text-[9px] font-black tracking-[0.2em] text-zinc-600">
              NO HISTORY YET
            </p>
            <p className="mt-3 text-sm text-zinc-500">
              Published signals will appear here automatically.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {signals.map((signal) => {
            const state = lifecycle(signal);

            return (
              <div
                key={signal.signalId}
                className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-5 transition hover:border-white/[0.12]"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-black">
                        {signal.symbol || "UNKNOWN"}
                      </h2>

                      <span className="rounded-full border border-white/[0.08] px-2 py-1 font-mono text-[8px] font-bold tracking-wider text-zinc-400">
                        {signal.direction || "SIGNAL"}
                      </span>
                    </div>

                    <p className="mt-2 text-[10px] text-zinc-600">
                      Published {formatDate(signal.publishedAt)}
                    </p>
                  </div>

                  <span className="rounded-full border border-cyan-400/15 bg-cyan-400/[0.04] px-3 py-1.5 font-mono text-[9px] font-black tracking-wider text-cyan-300">
                    {state}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl bg-white/[0.025] p-3">
                    <p className="text-[8px] uppercase tracking-widest text-zinc-700">
                      Entry
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {signal.lifecycle?.entryHit ? "HIT" : "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/[0.025] p-3">
                    <p className="text-[8px] uppercase tracking-widest text-zinc-700">
                      Stop
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {signal.lifecycle?.stopLossHit ? "HIT" : "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/[0.025] p-3">
                    <p className="text-[8px] uppercase tracking-widest text-zinc-700">
                      Outcome
                    </p>
                    <p className="mt-1 text-xs font-bold text-zinc-300">
                      {signal.lifecycle?.outcome || "OPEN"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/[0.025] p-3">
                    <p className="text-[8px] uppercase tracking-widest text-zinc-700">
                      Closed
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {formatDate(signal.lifecycle?.closedAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
