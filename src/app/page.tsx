"use client";

import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  auth,
  googleProvider,
  initAnalytics,
} from "@/lib/firebase";

const KITSETUPS_DEVICE_ID = "kitsetups_device_id";

function getDeviceId() {
  if (typeof window === "undefined") return null;

  try {
    let deviceId = localStorage.getItem(KITSETUPS_DEVICE_ID);

    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem(KITSETUPS_DEVICE_ID, deviceId);
    }

    return deviceId;
  } catch (error) {
    console.error("❌ Device ID error:", error);
    return null;
  }
}

type Tab = "home" | "setups" | "analysis" | "profile";

type NartSetup = {
  symbol?: string;
  pair?: string;

  price?: number | string;
  direction?: string;
  side?: string;

  entry?: number | string | null;
  stop?: number | string | null;
  target?: number | string | null;

  riskReward?: number | string | null;
  rr?: string;

  status?: string;
  stage?: string;
  grade?: string;
  score?: number | string | null;
  confidence?: string | null;
  quality?: string;
  timeframe?: string | null;
  bias?: string;

  premium?: boolean;
  thesis?: string;
  signalState?: string;

  lifecycleStatus?: string | null;

  tradePlan?: {
    lifecycleStatus?: string | null;
    bias?: string;
    direction?: string;
    status?: string;
    stage?: string;
    grade?: string;
    score?: number | string | null;
    confidence?: string | null;
    entry?: number | string | null;
    stop?: number | string | null;
    target?: number | string | null;
    riskReward?: number | string | null;
    reason?: string[];
    entryZone?: {
      timeframe?: string | null;
    } | null;
  };

  lifecycle?: {
    status?: string | null;
    entryHit?: boolean;
    entryHitAt?: string | null;
    stopLossHit?: boolean;
    stopLossHitAt?: string | null;
    outcome?: string | null;
    closedAt?: string | null;
    lastPrice?: number | null;
    lastCheckedAt?: string | null;
    targets?: Array<{
      price?: number;
      hit?: boolean;
      hitAt?: string | null;
    }>;
  };

  reason?: string[];

  entryZone?: {
    timeframe?: string | null;
  } | null;

  generatedAt?: string;
};

type NartAnalysis = {
  symbol: string;
  price: number | string;
  market?: unknown;
  structures?: Record<string, unknown>;
  alignment?: unknown;
  weeklyContext?: unknown;
  tradePlan?: {
    bias?: string;
    direction?: string;
    status?: string;
    entry?: number | null;
    stop?: number | null;
    target?: number | null;
    riskReward?: number | string | null;
    reason?: string[];
    execution?: {
      required?: boolean;
      status?: string;
    };
  };
  generatedAt?: string;
};


const setups: NartSetup[] = [
  {
    pair: "BTCUSDT",
    side: "LONG",
    quality: "A+",
    price: "76,920.40",
    entry: "76,845.20",
    stop: "76,420.00",
    target: "78,480.00",
    rr: "3.42R",
    timeframe: "LIVE ENGINE",
    premium: false,
    status: "ACTIVE",
    confidence: "94%",
    thesis: "Liquidity sweep followed by bullish structure expansion.",
  },
  {
    pair: "ETHUSDT",
    side: "SHORT",
    quality: "A",
    price: "4,216.80",
    entry: "4,228.10",
    stop: "4,275.00",
    target: "4,082.00",
    rr: "3.12R",
    timeframe: "LIVE ENGINE",
    premium: false,
    status: "ACTIVE",
    confidence: "89%",
    thesis: "Bearish displacement with rejection from a key supply zone.",
  },
  {
    pair: "SOLUSDT",
    side: "LONG",
    quality: "A+",
    price: "196.42",
    entry: "194.80",
    stop: "190.20",
    target: "211.50",
    rr: "3.63R",
    timeframe: "LIVE ENGINE",
    premium: true,
    status: "LOCKED",
    confidence: "96%",
    thesis: "Higher-timeframe demand with strong continuation structure.",
  },
];

function formatPrice(value: number | string | null | undefined) {
  if (value == null || value === "" || value === "—") return "—";

  const num = Number(value);

  if (!Number.isFinite(num)) return String(value);

  if (Math.abs(num) >= 1000) {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  if (Math.abs(num) >= 1) {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }

  if (Math.abs(num) >= 0.01) {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  }

  return num.toLocaleString("en-US", {
    maximumFractionDigits: 8,
  });
}

function LiveBadge() {
  return (
    <div className="inline-flex items-center gap-2 border border-red-500/20 bg-red-500/[0.04] px-2.5 py-1">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute h-full w-full animate-ping rounded-full bg-red-500 opacity-70" />
        <span className="relative h-1.5 w-1.5 rounded-full bg-red-500" />
      </span>

      <span className="font-mono text-[8px] font-bold tracking-[0.2em] text-red-400">
        <div
  className="relative flex h-8 w-8 items-center justify-center"
  aria-label="Scanning for signals"
>
  <span className="absolute h-5 w-5 rounded-full border border-emerald-400/30 animate-ping" />
  <span className="absolute h-6 w-6 rounded-full border border-emerald-400/15 animate-[ping_2s_ease-out_infinite]" />

  <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]">
    <span className="absolute inset-0 rounded-full bg-emerald-300 animate-pulse" />
  </span>

  <span className="absolute h-px w-7 overflow-hidden rounded-full bg-emerald-400/10">
    <span className="absolute left-0 top-0 h-full w-2/5 bg-emerald-400/70 animate-[scan_1.6s_ease-in-out_infinite]" />
  </span>
</div>
      </span>
    </div>
  );
}

function Metric({
  label,
  value,
  cyan = false,
}: {
  label: string;
  value: string;
  cyan?: boolean;
}) {
  return (
    <div className="border-l border-white/[0.08] pl-3">
      <p className="font-mono text-[8px] font-semibold tracking-[0.16em] text-zinc-600">
        {label}
      </p>

      <p
        className={`mt-1 font-mono text-sm font-semibold tracking-tight ${
          cyan ? "text-cyan-300" : "text-zinc-200"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function getSetupStatus(status?: string | null) {
  return String(status || "WATCH").toUpperCase().trim();
}

function isWatchStatus(status?: string | null) {
  const value = getSetupStatus(status);
  return value === "WATCH" || value === "DEVELOPING";
}

function isExecutionStatus(status?: string | null) {
  const value = getSetupStatus(status);

  return [
    "READY",
    "ARMED",
    "ACTIVE",
    "TP_HIT",
    "STOP_LOSS",
    "MISSED",
    "EXPIRED",
  ].includes(value);
}

function SetupCard({
  setup,
  onOpen,
  signalLocked = false,
}: {
  setup: (typeof setups)[number] & {
    stage?: string;
    grade?: string;
    score?: number | string | null;
    confidence?: string | null;
    lifecycle?: {
      status?: string | null;
      entryHit?: boolean;
      entryHitAt?: string | null;
      stopLossHit?: boolean;
      stopLossHitAt?: string | null;
      outcome?: string | null;
      closedAt?: string | null;
      lastPrice?: number | null;
      lastCheckedAt?: string | null;
      targets?: Array<{
        price?: number;
        hit?: boolean;
        hitAt?: string | null;
      }>;
    };
  };
  onOpen: () => void;
  signalLocked?: boolean;
}) {
  const locked = setup.premium || signalLocked;
  const bullish = setup.side === "LONG";
  const status = getSetupStatus(setup.status);
  const watchOnly = isWatchStatus(status);
  const executionStatus = isExecutionStatus(status);

  const lifecycle = setup.lifecycle || {};

  /*
   * LIFECYCLE AUTHORITY
   *
   * Backend lifecycle is the source of truth.
   * Never let the fresh trade-plan status overwrite
   * an evaluated lifecycle state.
   */
  const lifecycleStatus = getSetupStatus(
    lifecycle.status ||
    setup.signalState ||
    setup.tradePlan?.lifecycleStatus ||
    status
  );

  const hitTargets = Array.isArray(lifecycle.targets)
    ? lifecycle.targets.filter((target) => target.hit).length
    : 0;

  const totalTargets = Array.isArray(lifecycle.targets)
    ? lifecycle.targets.length
    : 0;

  const lifecycleClosed = [
    "TP_HIT",
    "STOP_LOSS",
    "MISSED",
    "EXPIRED",
  ].includes(lifecycleStatus);

  const lifecycleLabel =
    lifecycleStatus === "TP_HIT"
      ? "TARGET HIT"
      : lifecycleStatus === "STOP_LOSS"
        ? "STOP LOSS"
        : lifecycleStatus === "MISSED"
          ? "MISSED"
          : lifecycleStatus === "EXPIRED"
            ? "EXPIRED"
            : lifecycleStatus === "ACTIVE"
              ? "ENTRY HIT · ACTIVE"
              : lifecycleStatus;

  const hasExecutionLevels =
    setup.entry != null &&
    setup.stop != null &&
    setup.target != null;

  const entryHit = Boolean(lifecycle.entryHit);

  const lifecycleIsClosed = [
    "TP_HIT",
    "STOP_LOSS",
    "MISSED",
    "EXPIRED",
  ].includes(lifecycleStatus);

  const lifecycleIsPreEntry =
    !entryHit &&
    ["READY", "ARMED", "DEVELOPING"].includes(lifecycleStatus);

  const lifecycleIsActive =
    entryHit &&
    !lifecycleIsClosed &&
    lifecycleStatus === "ACTIVE";




  return (
    <button
      onClick={onOpen}
      className="group w-full text-left"
    >
      <div
        className={`relative overflow-hidden border transition-all duration-300 ${
          locked
            ? "border-amber-400/15 bg-[#090a0b]"
            : "border-white/[0.07] bg-[#090a0b]"
        } hover:-translate-y-[2px] hover:border-cyan-400/25`}
      >

        {/* SIGNAL ACCENT */}
        <div
          className={`h-px w-full ${
            locked
              ? "bg-amber-400/40"
              : bullish
                ? "bg-emerald-400/40"
                : "bg-red-400/40"
          }`}
        />

        <div className="p-5">

          {signalLocked && (
            <div className="mb-5 border border-amber-400/15 bg-amber-400/[0.04] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[8px] font-bold tracking-[0.18em] text-amber-300">
                    FREE ACCESS ENDED
                  </p>
                  <p className="mt-1 text-[10px] leading-5 text-zinc-500">
                    Your 3-day trial has ended. Execution levels are locked.
                  </p>
                </div>

                <span className="shrink-0 text-[9px] font-black text-amber-300">
                  ◆
                </span>
              </div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpen();
                }}
                className="mt-3 w-full border border-amber-400/20 bg-amber-400/[0.08] px-3 py-2.5 font-mono text-[8px] font-black tracking-[0.14em] text-amber-300 transition hover:bg-amber-400/[0.12]"
              >
                UNLOCK PREMIUM · $30 / MONTH
              </button>
            </div>
          )}

          {/* HEADER */}
          <div className="flex min-w-0 items-start justify-between gap-3">

            <div>
              <div className="flex min-w-0 items-center gap-2">

                <h3 className="truncate font-mono text-lg font-bold tracking-tight text-white">
                  {setup.pair}
                </h3>

                <span
                  className={`border px-2 py-1 font-mono text-[8px] font-bold tracking-[0.16em] ${
                    bullish
                      ? "border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-400"
                      : "border-red-400/20 bg-red-400/[0.05] text-red-400"
                  }`}
                >
                  {setup.side}
                </span>

              </div>

              <p className="mt-1.5 font-mono text-[7px] tracking-[0.12em] text-zinc-600">
                {setup.timeframe !== "LIVE ENGINE" ? setup.timeframe : "LIVE ENGINE"}
              </p>
            </div>

            <div className="w-[88px] shrink-0 text-right">

              <div className="flex min-w-0 items-center justify-end gap-1 overflow-hidden">
                <span
                  className={
                    setup.status === "ACTIVE"
                      ? "h-1 w-1 shrink-0 rounded-full bg-red-500 shadow-[0_0_9px_rgba(239,68,68,0.65)]"
                      : setup.status === "READY"
                        ? "h-1 w-1 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_9px_rgba(34,211,238,0.65)]"
                        : setup.status === "ARMED"
                          ? "h-1 w-1 shrink-0 rounded-full bg-amber-400 shadow-[0_0_9px_rgba(251,191,36,0.55)]"
                          : setup.status === "DEVELOPING"
                            ? "h-1 w-1 shrink-0 rounded-full bg-zinc-400"
                            : setup.status === "TARGET_HIT" ||
                                setup.status === "TP_HIT"
                              ? "h-1 w-1 shrink-0 rounded-full bg-emerald-400"
                              : setup.status === "STOP_HIT"
                                ? "h-1 w-1 shrink-0 rounded-full bg-red-600"
                                : "h-1 w-1 shrink-0 rounded-full bg-zinc-500"
                  }
                />

                <span
                  className={
                    setup.status === "ACTIVE"
                      ? "truncate font-mono text-[6px] font-bold tracking-[0.1em] text-red-400"
                      : setup.status === "READY"
                        ? "truncate font-mono text-[6px] font-bold tracking-[0.1em] text-cyan-400"
                        : setup.status === "ARMED"
                          ? "truncate font-mono text-[6px] font-bold tracking-[0.1em] text-amber-300"
                          : setup.status === "DEVELOPING"
                            ? "truncate font-mono text-[6px] font-bold tracking-[0.1em] text-zinc-400"
                            : setup.status === "TARGET_HIT" ||
                                setup.status === "TP_HIT"
                              ? "truncate font-mono text-[6px] font-bold tracking-[0.1em] text-emerald-400"
                              : setup.status === "STOP_HIT"
                                ? "truncate font-mono text-[6px] font-bold tracking-[0.1em] text-red-500"
                                : "truncate font-mono text-[6px] font-bold tracking-[0.1em] text-zinc-500"
                  }
                >
                  {setup.status || "UNKNOWN"}
                </span>
              </div>

              <p className="mt-2 font-mono text-[6px] tracking-[0.12em] text-zinc-600">
                SETUP GRADE
              </p>

              <p className="font-mono text-xs font-bold text-cyan-300">
                {setup.grade || setup.quality || "WATCH"}
              </p>

              <p className="mt-1 font-mono text-[6px] font-bold tracking-[0.1em] text-zinc-600">
                {setup.score != null ? `${setup.score}/100` : "—"}
              </p>

            </div>

          </div>

          {/* CURRENT PRICE */}
          <div className="mt-7 border-y border-white/[0.05] py-5">

            <p className="font-mono text-[7px] tracking-[0.2em] text-zinc-600">
              CURRENT MARKET PRICE
            </p>

            <div className="mt-1 flex items-end justify-between">

              <p className="font-mono text-3xl font-bold tracking-tight text-white">
                ${setup.price}
              </p>

              <span className="font-mono text-[8px] tracking-[0.14em] text-zinc-700">
                {(setup.pair || setup.symbol || "UNKNOWN").replace("USDT", "")}/USDT
              </span>

            </div>

          </div>

          {!watchOnly && executionStatus && hasExecutionLevels && (
            <>
              {/* EXECUTION MAP */}
              <div className="mt-7">

                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[8px] font-bold tracking-[0.2em] text-zinc-500">
                      EXECUTION MAP
                    </p>

                    <p className="mt-1 truncate text-[10px] text-zinc-700">
                      Trade levels generated by KitSetups
                    </p>
                  </div>

                  <span
                    className={`shrink-0 font-mono text-[8px] font-bold ${
                      bullish
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {setup.side === "LONG"
                      ? "↑ LONG"
                      : "↓ SHORT"}
                  </span>
                </div>

                <div className="space-y-3">

                  <div className="flex min-w-0 items-center justify-between gap-4 border-b border-white/[0.05] pb-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[8px] font-bold tracking-[0.18em] text-cyan-400">
                        ENTRY
                      </p>
                      <p className="mt-1 text-[9px] text-zinc-600">
                        Execution zone
                      </p>
                    </div>

                    <p className="shrink-0 font-mono text-base font-bold text-cyan-300">
                      {signalLocked ? "••••••" : `$${setup.entry}`}
                    </p>
                  </div>

                  <div className="flex min-w-0 items-center justify-between gap-4 border-b border-white/[0.05] pb-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[8px] font-bold tracking-[0.18em] text-red-400">
                        STOP LOSS
                      </p>
                      <p className="mt-1 text-[9px] text-zinc-600">
                        Invalidates thesis
                      </p>
                    </div>

                    <p className="shrink-0 font-mono text-base font-bold text-red-300">
                      {signalLocked ? "••••••" : `$${setup.stop}`}
                    </p>
                  </div>

                  <div className="flex min-w-0 items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-mono text-[8px] font-bold tracking-[0.18em] text-emerald-400">
                        TAKE PROFIT
                      </p>
                      <p className="mt-1 text-[9px] text-zinc-600">
                        Primary objective
                      </p>
                    </div>

                    <p className="shrink-0 font-mono text-base font-bold text-emerald-300">
                      {signalLocked ? "••••••" : `$${setup.target}`}
                    </p>
                  </div>

                </div>
              </div>
            </>
          )}

          {watchOnly && (
            <div className="mt-7 border border-amber-400/[0.10] bg-amber-400/[0.025] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[8px] font-bold tracking-[0.18em] text-amber-300">
                    WATCH
                  </p>
                  <p className="mt-1 text-[10px] leading-5 text-zinc-600">
                    Market structure is developing. No execution levels yet.
                  </p>
                </div>

                <span className="shrink-0 font-mono text-[8px] font-bold text-amber-300">
                  WAIT
                </span>
              </div>
            </div>
          )}

          {!watchOnly && (
            <>
              {/* SIGNAL LIFECYCLE */}
              {!watchOnly && (
                <div className="mt-5 border border-white/[0.05] bg-white/[0.01] px-4 py-3">

                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-[7px] font-bold tracking-[0.2em] text-zinc-600">
                      SIGNAL LIFECYCLE
                    </p>

                    <p
                      className={`font-mono text-[8px] font-bold tracking-[0.12em] ${
                        lifecycleStatus === "TP_HIT"
                          ? "text-emerald-400"
                          : lifecycleStatus === "STOP_LOSS"
                            ? "text-red-400"
                            : lifecycleStatus === "EXPIRED" ||
                                lifecycleStatus === "MISSED"
                              ? "text-zinc-400"
                              : lifecycleIsActive
                                ? "text-violet-400"
                                : "text-amber-300"
                      }`}
                    >
                      {lifecycleLabel}
                    </p>
                  </div>

                  {/* PRE-ENTRY / EXPIRED / MISSED */}
                  {(lifecycleStatus === "EXPIRED" ||
                    lifecycleStatus === "MISSED" ||
                    lifecycleIsPreEntry) && (
                    <div className="mt-3 flex items-center gap-2 overflow-hidden">

                      <span className="font-mono text-[7px] font-bold text-amber-300">
                        ● READY
                      </span>

                      <span className="text-[8px] text-zinc-800">→</span>

                      <span
                        className={`font-mono text-[7px] font-bold ${
                          lifecycleStatus === "EXPIRED" ||
                          lifecycleStatus === "MISSED"
                            ? "text-zinc-500"
                            : "text-blue-400"
                        }`}
                      >
                        {lifecycleStatus === "EXPIRED"
                          ? "NOT REACHED"
                          : lifecycleStatus === "MISSED"
                            ? "NOT REACHED"
                            : "WAITING"}
                      </span>

                      {(lifecycleStatus === "EXPIRED" ||
                        lifecycleStatus === "MISSED") && (
                        <>
                          <span className="text-[8px] text-zinc-800">→</span>

                          <span
                            className={`font-mono text-[7px] font-bold ${
                              lifecycleStatus === "EXPIRED"
                                ? "text-zinc-400"
                                : "text-zinc-400"
                            }`}
                          >
                            {lifecycleStatus}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* ACTIVE TRADE */}
                  {entryHit &&
                    lifecycleStatus !== "TP_HIT" &&
                    lifecycleStatus !== "STOP_LOSS" &&
                    lifecycleStatus !== "EXPIRED" &&
                    lifecycleStatus !== "MISSED" && (
                      <div className="mt-3 flex items-center gap-2 overflow-hidden">

                        <span className="font-mono text-[7px] font-bold text-amber-300">
                          ● READY
                        </span>

                        <span className="text-[8px] text-zinc-800">→</span>

                        <span className="font-mono text-[7px] font-bold text-blue-400">
                          ● ENTRY
                        </span>

                        <span className="text-[8px] text-zinc-800">→</span>

                        <span className="font-mono text-[7px] font-bold text-violet-400">
                          ● ACTIVE
                        </span>

                        <span className="text-[8px] text-zinc-800">→</span>

                        <span className="font-mono text-[7px] font-bold text-zinc-600">
                          TARGETS
                        </span>

                        <span className="text-[8px] text-zinc-800">→</span>

                        <span className="font-mono text-[7px] font-bold text-zinc-600">
                          OPEN
                        </span>

                      </div>
                    )}

                  {/* TAKE PROFIT */}
                  {lifecycleStatus === "TP_HIT" && (
                    <div className="mt-3 flex items-center gap-2 overflow-hidden">

                      <span className="font-mono text-[7px] font-bold text-amber-300">
                        ● READY
                      </span>

                      <span className="text-[8px] text-zinc-800">→</span>

                      <span className="font-mono text-[7px] font-bold text-blue-400">
                        ● ENTRY
                      </span>

                      <span className="text-[8px] text-zinc-800">→</span>

                      <span className="font-mono text-[7px] font-bold text-violet-400">
                        ● ACTIVE
                      </span>

                      <span className="text-[8px] text-zinc-800">→</span>

                      <span className="font-mono text-[7px] font-bold text-emerald-400">
                        ● TARGET
                      </span>

                      <span className="text-[8px] text-zinc-800">→</span>

                      <span className="font-mono text-[7px] font-bold text-emerald-400">
                        ● PROFIT
                      </span>

                    </div>
                  )}

                  {/* STOP LOSS */}
                  {lifecycleStatus === "STOP_LOSS" && (
                    <div className="mt-3 flex items-center gap-2 overflow-hidden">

                      <span className="font-mono text-[7px] font-bold text-amber-300">
                        ● READY
                      </span>

                      <span className="text-[8px] text-zinc-800">→</span>

                      <span className="font-mono text-[7px] font-bold text-blue-400">
                        ● ENTRY
                      </span>

                      <span className="text-[8px] text-zinc-800">→</span>

                      <span className="font-mono text-[7px] font-bold text-violet-400">
                        ● ACTIVE
                      </span>

                      <span className="text-[8px] text-zinc-800">→</span>

                      <span className="font-mono text-[7px] font-bold text-red-400">
                        ● STOP
                      </span>

                      <span className="text-[8px] text-zinc-800">→</span>

                      <span className="font-mono text-[7px] font-bold text-red-400">
                        ● LOSS
                      </span>

                    </div>
                  )}

                  {/* TARGET PROGRESS */}
                  {totalTargets > 0 &&
                    lifecycleStatus !== "TP_HIT" &&
                    lifecycleStatus !== "STOP_LOSS" &&
                    lifecycleStatus !== "EXPIRED" &&
                    lifecycleStatus !== "MISSED" && (
                      <div className="mt-2 font-mono text-[6px] tracking-[0.12em] text-emerald-400">
                        TP {hitTargets}/{totalTargets}
                      </div>
                    )}

                </div>
              )}

              {/* RISK / REWARD */}
              <div className="mt-7 grid grid-cols-2 gap-3">

                <div className="border border-white/[0.06] bg-white/[0.015] p-4">
                  <p className="font-mono text-[7px] tracking-[0.18em] text-zinc-600">
                    RISK / REWARD
                  </p>

                  <p className="mt-2 font-mono text-2xl font-bold text-cyan-300">
                    {signalLocked ? "••••" : setup.rr}
                  </p>
                </div>

                <div className="border border-white/[0.06] bg-white/[0.015] p-4">
                  <p className="font-mono text-[7px] tracking-[0.18em] text-zinc-600">
                    CONFIDENCE
                  </p>

                  <p className="mt-2 font-mono text-2xl font-bold text-white">
                    {setup.confidence || "—"}
                  </p>

                  {setup.score != null && (
                    <p className="mt-1 font-mono text-[7px] tracking-[0.14em] text-zinc-600">
                      SCORE {setup.score}/100
                    </p>
                  )}
                </div>

              </div>

              {/* THESIS */}
              <div className="mt-5 border-l border-cyan-400/30 bg-cyan-400/[0.015] px-4 py-3">

                <div className="flex items-center gap-2">
                  <span className="h-1 w-1 bg-cyan-400" />

                  <span className="font-mono text-[7px] font-bold tracking-[0.2em] text-cyan-400/70">
                    ENGINE THESIS
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  {setup.thesis}
                </p>

              </div>

              {/* FOOTER */}
              <div className="mt-5 flex items-center justify-between border-t border-white/[0.05] pt-4">

                <span className="font-mono text-[7px] tracking-[0.16em] text-zinc-700">
                  KitSetups / {locked ? "PREMIUM SIGNAL" : "PUBLIC SIGNAL"}
                </span>

                <span className="font-mono text-[8px] font-bold tracking-[0.16em] text-zinc-500 transition group-hover:text-cyan-300">
                  {locked ? "UNLOCK →" : "INSPECT →"}
                </span>

              </div>
            </>
          )}

        </div>
      </div>
    </button>
  );
}



export default function Home() {

  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "home";
    const saved = sessionStorage.getItem("kitsetups-tab");
    return saved === "home" ||
      saved === "setups" ||
      saved === "analysis" ||
      saved === "profile"
      ? saved
      : "home";
  });


  const [userId, setUserId] =
    useState<string>("");

  const [liveAnalysis, setLiveAnalysis] =
    useState<NartAnalysis | null>(null);

  const [analysisError, setAnalysisError] =
    useState<string | null>(null);

  const [liveSetups, setLiveSetups] =
    useState<NartSetup[]>([]);

  const [signalLocked, setSignalLocked] =
    useState(false);

  const [trialEndsAt, setTrialEndsAt] =
    useState<string | null>(null);


  const [apiLoading, setApiLoading] =
    useState(true);

  const [apiError, setApiError] =
    useState<string | null>(null);

  const [showT3KitPromo, setShowT3KitPromo] = useState(false);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const showPromo = () => {
      setShowT3KitPromo(true);

      hideTimer = setTimeout(() => {
        setShowT3KitPromo(false);
      }, 9000);
    };

    const initialTimer = setTimeout(showPromo, 5000);

    const interval = setInterval(() => {
      showPromo();
    }, 30000);

    return () => {
      clearTimeout(initialTimer);
      if (hideTimer) clearTimeout(hideTimer);
      clearInterval(interval);
    };
  }, []);

  const [account, setAccount] = useState<{
    plan: string;
    planName: string;
    trialActive?: boolean;
    trialStartedAt?: string | null;
    trialEndsAt?: string | null;
    trialRemainingMs?: number | null;
    accessLocked?: boolean;
  } | null>(null);




  const [modal, setModal] = useState<{
    title: string;
    message: string;
    success?: boolean;
  } | null>(null);

  const [authLoading, setAuthLoading] =
    useState(true);


  const [authUser, setAuthUser] =
    useState<{
      id: string;
      email: string;
      displayName?: string | null;
      photoURL?: string | null;
    } | null>(null);

  const [authError, setAuthError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    initAnalytics().catch((error) => {
      console.error("❌ Firebase Analytics failed:", error);
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (cancelled) return;

      if (user) {
        setAuthUser({
          id: user.uid,
          email: user.email || "",
          displayName: user.displayName || null,
          photoURL: user.photoURL || null,
        });

        setUserId(user.uid);
        setAuthError(null);
      } else {
        setAuthUser(null);
        setUserId("");
        setAccount(null);
      }

      setAuthLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  async function getFirebaseToken() {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) return null;

      return await currentUser.getIdToken();
    } catch (error) {
      console.error("❌ Firebase token retrieval failed:", error);
      return null;
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadAccount() {
      if (!userId) {
        setAccount(null);
        return;
      }

      try {
        const base =
          process.env.NEXT_PUBLIC_NART_API ||
          "https://nart-jnr-1.onrender.com";

        const token = await getFirebaseToken();

        if (!token) {
          throw new Error("Authentication token unavailable");
        }

        const response = await fetch(`${base}/api/account`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Nart-User": userId,
            "X-KitSetups-Device": getDeviceId() || "",
          },
          cache: "no-store",
          credentials: "include",
        });

        const payload = await response.json();


        if (!response.ok || !payload.ok) {
          throw new Error(
            payload.error ||
            `Account API returned ${response.status}`
          );
        }

        if (!cancelled) {
          setAccount(payload.data);
        }
      } catch (error) {
        console.error("❌ Account loading failed:", error);
      }
    }

    loadAccount();

    return (

) => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    async function loadAnalysis() {
      if (!authUser) {
        if (!cancelled) {
          setLiveAnalysis(null);
        }
        return;
      }

      try {
        const base =
          process.env.NEXT_PUBLIC_NART_API ||
          "https://nart-jnr-1.onrender.com";

        const token = await getFirebaseToken();

        console.log("KITSETUPS AUTH DEBUG:", {
          uid: userId,
          email: authUser.email,
          hasToken: !!token,
          tokenLength: token?.length || 0,
        });

        if (!token) {
          throw new Error("Authentication token unavailable");
        }

        const response = await fetch(`${base}/api/analysis`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Nart-User": userId,
          },
          cache: "no-store",
          credentials: "include",
        });

        const payload = await response.json();

        if (!cancelled) {
        }

        if (!response.ok || !payload.ok) {
          throw new Error(
            payload.error ||
            `Analysis API returned ${response.status}`
          );
        }

        if (!cancelled) {
          setLiveAnalysis(payload.data);
        }
      } catch (error) {
        console.error("❌ Analysis loading failed:", error);

        if (!cancelled) {
          setLiveAnalysis(null);
          setAnalysisError(
            error instanceof Error
              ? error.message
              : "Analysis failed to load"
          );
        }
      }
    }

    async function loadSignals() {
      if (!authUser) {
        if (!cancelled) {
          setLiveSetups([]);
          setApiLoading(false);
        }
        return;
      }

      try {
        setApiLoading(true);
        setApiError(null);

        const base =
          process.env.NEXT_PUBLIC_NART_API ||
          "https://nart-jnr-1.onrender.com";

        const token = await getFirebaseToken();

        console.log("KITSETUPS AUTH DEBUG:", {
          uid: userId,
          email: authUser.email,
          hasToken: !!token,
          tokenLength: token?.length || 0,
        });

        if (!token) {
          throw new Error("Authentication token unavailable");
        }

        if (!cancelled) {
        }

        const response = await fetch(`${base}/api/signals`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Nart-User": userId,
          },
          cache: "no-store",
          credentials: "include",
        });

        const payload = await response.json();

        if (!response.ok || !payload.ok) {
          throw new Error(
            payload.error ||
            `Signals API returned ${response.status}`
          );
        }

        const signals = Array.isArray(payload.data?.signals)
          ? payload.data.signals
          : [];

        const locked = payload.data?.locked === true;

        const trialEnd =
          typeof payload.data?.trialEndsAt === "string"
            ? payload.data.trialEndsAt
            : null;

        if (!cancelled) {
          setLiveSetups(signals);
          setSignalLocked(locked);
          setTrialEndsAt(trialEnd);
          setApiError(null);
        }
      } catch (error) {
        console.error("❌ Signal loading failed:", error);

        if (!cancelled) {
          setLiveSetups([]);
          setSignalLocked(false);
          setTrialEndsAt(null);
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load signals";

          setApiError(message);

        }
      } finally {
        if (!cancelled) {
          setApiLoading(false);
        }
      }
    }

    loadAnalysis();
    loadSignals();

    return () => {
      cancelled = true;
    };
  }, [authUser, userId]);

  async function loginWithGoogle() {
    try {
      setAuthError(null);
      setAuthLoading(true);

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      setAuthUser({
        id: user.uid,
        email: user.email || "",
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
      });

      setUserId(user.uid);
      setAuthError(null);
    } catch (error) {
      console.error("❌ Google sign-in failed:", error);

      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "auth/popup-closed-by-user"
      ) {
        setAuthError(null);
      } else if (error instanceof Error) {
        setAuthError(error.message);
      } else {
        setAuthError("Google sign-in failed. Please try again.");
      }
    } finally {
      setAuthLoading(false);
    }
  }

  async function logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("❌ Firebase logout failed:", error);
    }

    setAuthUser(null);
    setUserId("");
    setAccount(null);
    setTab("home");
  }

  const [selectedSetup, setSelectedSetup] =
    useState<(typeof setups)[number] | null>(null);

  // Keep the active section when the browser reloads.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedTab = window.sessionStorage.getItem("kitsetups-tab");

    if (
      savedTab === "home" ||
      savedTab === "setups" ||
      savedTab === "analysis" ||
      savedTab === "profile"
    ) {
      setTab(savedTab as Tab);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem("kitsetups-tab", tab);
  }, [tab]);


  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
          <p className="text-[10px] font-semibold tracking-[0.2em] text-zinc-500">
            KitSetups
          </p>
          <p className="mt-2 text-xs text-zinc-700">
            Checking your session...
          </p>
        </div>

<style jsx global>{`
  @keyframes scan {
    0% {
      transform: translateX(-150%);
      opacity: 0;
    }
    20% {
      opacity: 1;
    }
    80% {
      opacity: 1;
    }
    100% {
      transform: translateX(350%);
      opacity: 0;
    }
  }
`}</style>

</main>
    );
  }

  if (!authUser) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-5">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <p className="text-[9px] font-bold tracking-[0.28em] text-cyan-400/70">
              KITSETUPS
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight">
              Welcome back.
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Sign in to access your market intelligence.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/[0.07] bg-white/[0.025] p-5 shadow-2xl">
            <button
              type="button"
              onClick={loginWithGoogle}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-4 text-[10px] font-black tracking-[0.12em] text-zinc-200 transition hover:bg-white/[0.06]"
            >
              <span className="text-base font-bold">G</span>
              CONTINUE WITH GOOGLE
            </button>

            {authError && (
              <div className="mt-4 rounded-2xl border border-red-400/10 bg-red-400/[0.04] px-4 py-3">
                <p className="text-xs leading-5 text-red-300/80">
                  {authError}
                </p>
              </div>
            )}
          </div>

          <p className="mt-5 text-center text-[9px] tracking-[0.08em] text-zinc-700">
            Secured by Firebase Authentication.
          </p>
        </div>
      </main>
    );
  }

  const goTo = (next: Tab) => {
    setSelectedSetup(null);
    setTab(next);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("kitsetups-tab", next);
    }
  };

  const displaySetups = liveSetups.map((item) => {
    const plan = item.tradePlan || item;
    const direction = plan.direction || "WAIT";

    const bias =
      plan.bias ||
      (direction === "LONG"
        ? "bullish"
        : direction === "SHORT"
          ? "bearish"
          : "neutral");

    const lifecycle = item.lifecycle || {};

    /*
     * LIFECYCLE AUTHORITY
     *
     * Prefer the persisted lifecycle from the backend.
     * tradePlan.status is only a fallback for older signals
     * that do not contain lifecycle information.
     */
    const lifecycleStatus =
      String(
        lifecycle.status ||
        item.signalState ||
        plan.lifecycleStatus ||
        item.status ||
        plan.status ||
        "DEVELOPING"
      ).toUpperCase();

    const status = lifecycleStatus;

    const grade =
      item.grade ||
      plan.grade ||
      "WATCH";

    const score =
      item.score ??
      plan.score ??
      null;

    const confidence =
      item.confidence ||
      plan.confidence ||
      (
        grade === "A"
          ? "HIGH"
          : grade === "B"
            ? "MEDIUM"
            : grade === "C"
              ? "LOW"
              : "WATCH"
      );

    const stage =
      item.stage ||
      (
        status === "ARMED"
          ? "ARMED"
          : status === "READY"
            ? "READY"
            : status === "ACTIVE"
              ? "ACTIVE"
              : status
      );

    return {
      pair: item.symbol,
      side:
        direction === "SHORT"
          ? "SHORT"
          : direction === "LONG"
            ? "LONG"
            : "WAIT",

      quality: grade,
      grade,
      score,
      confidence,
      stage,

      price: formatPrice(item.price),

      entry:
        plan.entry != null
          ? formatPrice(plan.entry)
          : "—",

      stop:
        plan.stop != null
          ? formatPrice(plan.stop)
          : "—",

      target:
        plan.target != null
          ? formatPrice(plan.target)
          : "—",

      rr:
        plan.riskReward != null
          ? `${plan.riskReward}R`
          : "—",

      timeframe: "LIVE ENGINE",
      premium: false,
      status,

      lifecycle: {
        status: lifecycleStatus,
        entryHit: Boolean(lifecycle.entryHit),
        entryHitAt: lifecycle.entryHitAt || null,
        stopLossHit: Boolean(lifecycle.stopLossHit),
        stopLossHitAt: lifecycle.stopLossHitAt || null,
        outcome: lifecycle.outcome || null,
        closedAt: lifecycle.closedAt || null,
        targets: Array.isArray(lifecycle.targets)
          ? lifecycle.targets
          : [],
        lastPrice: lifecycle.lastPrice ?? null,
        lastCheckedAt: lifecycle.lastCheckedAt || null,
      },

      thesis:
        plan.reason?.length
          ? plan.reason.join(" • ")
          : "KitSetups is monitoring this market.",
    };
  });


  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#030506] pt-[73px] text-zinc-100">
      <div className="relative z-10 mx-auto min-h-screen max-w-6xl px-4 pb-28 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-400/[0.045] blur-[120px]" />
        <div className="pointer-events-none absolute right-[-180px] top-[30%] h-[300px] w-[300px] rounded-full bg-blue-500/[0.035] blur-[110px]" />
        {/* HEADER */}
        <header className="fixed left-0 right-0 top-0 z-[100] flex w-full items-center justify-between border-b border-white/[0.05] bg-[#030506]/95 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button onClick={() => goTo("home")} className="text-left">
            <img
              src="https://www.t3kit.xyz/assets/images/logo.webp"
              alt="T3Kit"
              className="h-9 w-auto object-contain"
            />
          </button>

          <LiveBadge />
        </header>

        {/* HOME */}
        {tab === "home" && !selectedSetup && (
          <section className="space-y-5 py-6">

            {/* HEADER */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold tracking-[0.22em] text-cyan-400/60">
                  KitSetups
                </p>

                <h1 className="mt-1 text-2xl font-black tracking-tight">
                  Trading intelligence.
                </h1>

                <p className="mt-1 text-xs text-zinc-600">
                  Your market, without the noise.
                </p>
              </div>

              <button
                onClick={() => goTo("profile")}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/[0.08] bg-white/[0.03] text-sm font-bold text-zinc-300 transition hover:bg-white/[0.06]"
              >
                {authUser?.photoURL ? (
                  <img
                    src={authUser.photoURL}
                    alt={authUser.displayName || "Profile"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>
                    {(authUser?.displayName ||
                      authUser?.email ||
                      "N")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </button>
            </div>

            {/* MARKET PULSE */}
            <div className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-5">

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-bold tracking-[0.18em] text-zinc-600">
                    MARKET PULSE
                  </p>

                  <p className="mt-2 text-sm font-bold text-zinc-200">
                    BTC / USDT
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  <span className="text-[8px] font-semibold tracking-[0.15em] text-cyan-400/70">
                    LIVE
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-end justify-between gap-4">

                <div>
                  <p className="font-mono text-2xl font-bold tracking-tight text-white">
                    {liveAnalysis?.price != null
                      ? String(liveAnalysis.price)
                      : "—"}
                  </p>

                  <p className="mt-1 text-[9px] text-zinc-600">
                    Current market price
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[8px] font-bold tracking-[0.16em] text-zinc-600">
                    BIAS
                  </p>

                  <p
                    className={`mt-1 text-xs font-bold ${
                      liveAnalysis?.tradePlan?.bias === "bullish"
                        ? "text-emerald-400"
                        : liveAnalysis?.tradePlan?.bias === "bearish"
                          ? "text-red-400"
                          : "text-zinc-400"
                    }`}
                  >
                    {liveAnalysis?.tradePlan?.bias
                      ? liveAnalysis.tradePlan.bias.toUpperCase()
                      : "NEUTRAL"}
                  </p>
                </div>

              </div>
            </div>

            {/* ACTIVE SIGNAL */}
            <div className="overflow-hidden rounded-3xl border border-cyan-400/10 bg-cyan-400/[0.025]">

              <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-4">
                <div>
                  <p className="text-[8px] font-bold tracking-[0.2em] text-cyan-400/60">
                    ACTIVE SIGNAL
                  </p>

                  <p className="mt-1 text-[10px] text-zinc-600">
                    Confirmed opportunities
                  </p>
                </div>

                <button
                  onClick={() => goTo("setups")}
                  className="text-[9px] font-bold tracking-[0.12em] text-zinc-500 transition hover:text-cyan-400"
                >
                  VIEW ALL →
                </button>
              </div>

              {displaySetups.length > 0 ? (
                <div className="p-5">

                  {(() => {
                    const setup = displaySetups[0];

                    return (
                      <button
                        onClick={() => {
                          const source =
                            liveSetups.find(
                              (item) =>
                                item.symbol === setup.pair
                            );

                          if (source) {
                            setSelectedSetup(source as any);
                          }
                        }}
                        className="w-full text-left"
                      >

                        <div className="flex min-w-0 items-start justify-between gap-3">

                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2">
                              <h2 className="text-xl font-black tracking-tight">
                                {setup.pair}
                              </h2>

                              <span
                                className={`rounded-full px-2 py-1 text-[8px] font-bold ${
                                  setup.side === "LONG"
                                    ? "bg-emerald-400/10 text-emerald-400"
                                    : setup.side === "SHORT"
                                      ? "bg-red-400/10 text-red-400"
                                      : "bg-white/[0.05] text-zinc-500"
                                }`}
                              >
                                {setup.side}
                              </span>
                            </div>

                            <p className="mt-2 whitespace-nowrap text-[9px] font-semibold tracking-[0.15em] text-zinc-600">
                              {setup.status}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="whitespace-nowrap text-[8px] font-bold tracking-[0.15em] text-zinc-600">
                              CONFIDENCE
                            </p>

                            <p className="mt-1 text-xs font-bold text-cyan-400">
                              {setup.confidence}
                            </p>
                          </div>

                        </div>

                        <div className="mt-6 grid grid-cols-3 gap-2">

                          <div className="rounded-2xl border border-white/[0.05] bg-black/20 p-3">
                            <p className="text-[8px] tracking-[0.12em] text-zinc-600">
                              PRICE
                            </p>
                            <p className="mt-2 font-mono text-xs font-bold text-zinc-200">
                              {setup.price}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/[0.05] bg-black/20 p-3">
                            <p className="text-[8px] tracking-[0.12em] text-zinc-600">
                              ENTRY
                            </p>
                            <p className="mt-2 font-mono text-xs font-bold text-zinc-200">
                              {setup.entry}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/[0.05] bg-black/20 p-3">
                            <p className="text-[8px] tracking-[0.12em] text-zinc-600">
                              RR
                            </p>
                            <p className="mt-2 font-mono text-xs font-bold text-cyan-400">
                              {setup.rr}
                            </p>
                          </div>

                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-2">

                          <div className="rounded-2xl border border-red-400/[0.08] bg-red-400/[0.02] p-3">
                            <p className="text-[8px] tracking-[0.12em] text-zinc-600">
                              STOP
                            </p>
                            <p className="mt-2 font-mono text-xs font-bold text-red-300">
                              {setup.stop}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-emerald-400/[0.08] bg-emerald-400/[0.02] p-3">
                            <p className="text-[8px] tracking-[0.12em] text-zinc-600">
                              TARGET
                            </p>
                            <p className="mt-2 font-mono text-xs font-bold text-emerald-300">
                              {setup.target}
                            </p>
                          </div>

                        </div>

                      </button>
                    );
                  })()}

                </div>
              ) : (
                <div className="px-5 py-10 text-center">

                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.025]">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                  </div>

                  <p className="mt-4 text-sm font-semibold text-zinc-400">
                    No confirmed setups
                  </p>

                  <p className="mx-auto mt-1 max-w-xs text-[10px] leading-5 text-zinc-600">
                    KitSetups is watching the market. A setup appears here only after confirmation.
                  </p>

                </div>
              )}

            </div>

            {/* SCANNER STATUS */}
            <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-[8px] font-bold tracking-[0.18em] text-zinc-600">
                    SCANNER
                  </p>

                  <p className="mt-2 text-sm font-bold text-zinc-300">
                    Monitoring markets
                  </p>
                </div>

                <span className="flex items-center gap-2 rounded-full border border-emerald-400/10 bg-emerald-400/[0.04] px-3 py-1.5 text-[8px] font-bold tracking-[0.12em] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  ACTIVE
                </span>

              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">

                <div className="rounded-2xl bg-white/[0.025] p-3">
                  <p className="text-lg font-bold text-zinc-200">
                    {displaySetups.length}
                  </p>
                  <p className="mt-1 text-[8px] tracking-[0.14em] text-zinc-600">
                    ACTIVE SETUPS
                  </p>
                </div>

                <div className="rounded-2xl bg-white/[0.025] p-3">
                  <p className="text-lg font-bold text-zinc-200">
                    5M
                  </p>
                  <p className="mt-1 text-[8px] tracking-[0.14em] text-zinc-600">
                    SCAN CYCLE
                  </p>
                </div>

              </div>

            </div>

            </section>
        )}

        {/* SETUPS */}
        {tab === "setups" && !selectedSetup && (
          <>
          <section className="py-8">
            <p className="text-xs tracking-[0.2em] text-zinc-600">
              MARKET
            </p>

            <h1 className="mt-2 text-3xl font-bold">Setups</h1>

            <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-500">
              Structured opportunities identified by the KitSetups engine.
            </p>

            <div className="mt-7 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {displaySetups.map((setup) => (
                <SetupCard
                  key={setup.pair}
                  setup={setup}
                  signalLocked={signalLocked}
                  onOpen={() => setSelectedSetup(setup)}
                />
              ))}
            </div>
          </section>
          </>
        )}

        {/* ANALYSIS */}
        {tab === "analysis" && !selectedSetup && (
          <section className="py-7">

            {/* BTC HEADER */}
            <div className="mb-7">
              <div className="flex items-center justify-between gap-4">

                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-400/15 bg-orange-400/[0.06]">
                    <span className="text-sm font-black text-orange-400">
                      ₿
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h1 className="text-lg font-black tracking-tight text-white">
                        Bitcoin
                      </h1>

                      <span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-2 py-0.5 font-mono text-[6px] font-bold tracking-[0.16em] text-zinc-500">
                        BTC / USDT
                      </span>
                    </div>

                    <p className="mt-1 text-[8px] tracking-[0.12em] text-zinc-600">
                      MARKET INTELLIGENCE
                    </p>
                  </div>
                </div>

                <LiveBadge />

              </div>
            </div>

            {liveAnalysis?.tradePlan ? (
              <div className="space-y-3">

                {/* MARKET OVERVIEW */}
                <div className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-5">

                  <div className="flex items-end justify-between gap-5">

                    <div className="min-w-0">
                      <p className="font-mono text-[7px] font-bold tracking-[0.18em] text-zinc-600">
                        BTC PRICE
                      </p>

                      <p className="mt-2 truncate font-mono text-2xl font-bold tracking-tight text-white">
                        {liveAnalysis?.price != null
                          ? `$${Number(liveAnalysis.price).toLocaleString()}`
                          : "—"}
                      </p>

                      <p className="mt-1 text-[8px] text-zinc-600">
                        Live market price
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-mono text-[7px] font-bold tracking-[0.18em] text-zinc-600">
                        MARKET BIAS
                      </p>

                      <p
                        className={`mt-2 text-sm font-black tracking-wide ${
                          liveAnalysis.tradePlan.bias === "bullish"
                            ? "text-emerald-400"
                            : liveAnalysis.tradePlan.bias === "bearish"
                              ? "text-red-400"
                              : "text-zinc-300"
                        }`}
                      >
                        {liveAnalysis.tradePlan.bias
                          ? liveAnalysis.tradePlan.bias.toUpperCase()
                          : "NEUTRAL"}
                      </p>
                    </div>

                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2">

                    <div className="rounded-2xl border border-white/[0.05] bg-black/20 p-3">
                      <p className="font-mono text-[7px] tracking-[0.12em] text-zinc-600">
                        DIRECTION
                      </p>

                      <p className="mt-2 truncate text-[10px] font-bold text-zinc-200">
                        {liveAnalysis.tradePlan.direction || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/[0.05] bg-black/20 p-3">
                      <p className="font-mono text-[7px] tracking-[0.12em] text-zinc-600">
                        STATUS
                      </p>

                      <p className="mt-2 truncate text-[10px] font-bold text-zinc-200">
                        {liveAnalysis.tradePlan.status || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-cyan-400/[0.08] bg-cyan-400/[0.025] p-3">
                      <p className="font-mono text-[7px] tracking-[0.12em] text-zinc-600">
                        RISK / REWARD
                      </p>

                      <p className="mt-2 text-[10px] font-bold text-cyan-300">
                        {liveAnalysis.tradePlan.riskReward != null
                          ? `${liveAnalysis.tradePlan.riskReward}R`
                          : "—"}
                      </p>
                    </div>

                  </div>
                </div>

                {/* MARKET READ */}
                <div className="rounded-3xl border border-white/[0.07] bg-white/[0.02] p-5">

                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <p className="font-mono text-[7px] font-bold tracking-[0.18em] text-cyan-400/60">
                        MARKET READ
                      </p>

                      <h2 className="mt-2 text-base font-bold tracking-tight text-white">
                        Why KitSetups is watching BTC
                      </h2>

                      <p className="mt-1 text-[9px] leading-5 text-zinc-600">
                        The current engine read on Bitcoin structure and direction.
                      </p>
                    </div>

                    <div className="hidden shrink-0 rounded-xl border border-white/[0.06] bg-white/[0.025] px-2.5 py-2 sm:block">
                      <span className="font-mono text-[7px] font-bold tracking-[0.12em] text-zinc-500">
                        BTC
                      </span>
                    </div>

                  </div>

                  <div className="mt-5 space-y-2">
                    {(liveAnalysis.tradePlan.reason || []).length > 0 ? (
                      (liveAnalysis.tradePlan.reason || []).map(
                        (reason, index) => (
                          <div
                            key={index}
                            className="flex gap-3 rounded-2xl border border-white/[0.045] bg-black/20 px-3.5 py-3"
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-cyan-400/[0.06] font-mono text-[7px] font-bold text-cyan-400/70">
                              {String(index + 1).padStart(2, "0")}
                            </span>

                            <p className="pt-0.5 text-[10px] leading-5 text-zinc-400">
                              {reason}
                            </p>
                          </div>
                        )
                      )
                    ) : (
                      <div className="rounded-2xl border border-white/[0.045] bg-black/20 p-4">
                        <p className="text-[10px] text-zinc-600">
                          No additional reasoning returned by the engine.
                        </p>
                      </div>
                    )}
                  </div>

                </div>

                {/* EXECUTION MAP */}
                <div className="rounded-3xl border border-white/[0.07] bg-white/[0.02] p-5">

                  <div className="mb-4">
                    <p className="font-mono text-[7px] font-bold tracking-[0.18em] text-zinc-600">
                      EXECUTION MAP
                    </p>

                    <p className="mt-1 text-[9px] text-zinc-600">
                      Engine levels for the current BTC scenario.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">

                    <div className="rounded-2xl border border-white/[0.05] bg-black/20 p-3">
                      <p className="font-mono text-[7px] tracking-[0.12em] text-zinc-600">
                        ENTRY
                      </p>

                      <p className="mt-2 truncate font-mono text-[10px] font-bold text-zinc-200">
                        {liveAnalysis.tradePlan.entry != null
                          ? `$${Number(
                              liveAnalysis.tradePlan.entry
                            ).toLocaleString()}`
                          : "WAIT"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-red-400/[0.07] bg-red-400/[0.018] p-3">
                      <p className="font-mono text-[7px] tracking-[0.12em] text-zinc-600">
                        STOP
                      </p>

                      <p className="mt-2 truncate font-mono text-[10px] font-bold text-red-300">
                        {liveAnalysis.tradePlan.stop != null
                          ? `$${Number(
                              liveAnalysis.tradePlan.stop
                            ).toLocaleString()}`
                          : "WAIT"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-400/[0.07] bg-emerald-400/[0.018] p-3">
                      <p className="font-mono text-[7px] tracking-[0.12em] text-zinc-600">
                        TARGET
                      </p>

                      <p className="mt-2 truncate font-mono text-[10px] font-bold text-emerald-300">
                        {liveAnalysis.tradePlan.target != null
                          ? `$${Number(
                              liveAnalysis.tradePlan.target
                            ).toLocaleString()}`
                          : "WAIT"}
                      </p>
                    </div>

                  </div>

                </div>

                {/* FOOTER STATE */}
                <div className="flex items-center justify-between px-1 pt-1">
                  <p className="font-mono text-[7px] tracking-[0.14em] text-zinc-700">
                    KITSETUPS BTC ENGINE
                  </p>

                  <p className="font-mono text-[7px] tracking-[0.14em] text-zinc-700">
                    LIVE ANALYSIS
                  </p>
                </div>

              </div>
            ) : (
              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] px-6 py-12 text-center">

                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.025]">
                  <span className="text-sm text-zinc-600">₿</span>
                </div>

                <p className="mt-4 text-xs font-semibold text-zinc-400">
                  {apiLoading
                    ? "Synchronizing BTC intelligence..."
                    : analysisError
                      ? `Analysis: ${analysisError}`
                      : "BTC analysis unavailable."}
                </p>

                <p className="mx-auto mt-2 max-w-xs text-[9px] leading-5 text-zinc-700">
                  KitSetups will display the latest Bitcoin market read when the
                  analysis engine returns.
                </p>

              </div>
            )}

          </section>
        )}

        {/* PROFILE */}
        {tab === "profile" && !selectedSetup && (
          <section className="py-6">

            {/* PROFILE HEADER */}
            <div className="mb-6 flex items-center gap-4">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] text-xl font-black text-cyan-300">
                {authUser?.photoURL ? (
                  <img
                    src={authUser.photoURL}
                    alt={authUser.displayName || "Profile"}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>
                    {(authUser?.displayName ||
                      authUser?.email ||
                      "N")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-xl font-black tracking-tight">
                            {authUser?.displayName ||
                              authUser?.email?.split("@")[0] ||
                              "Member"}
                          </h1>

                  <span className="rounded-full border border-cyan-400/15 bg-cyan-400/[0.06] px-2 py-0.5 text-[7px] font-bold tracking-[0.15em] text-cyan-300">
                    ACTIVE
                  </span>
                </div>

                <p className="mt-1 truncate font-mono text-[9px] text-zinc-600">
                  {authUser?.email || "Verified member"}
                </p>
              </div>

            </div>

            <div className="space-y-3">

              {/* PLAN + USAGE */}
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-[8px] font-bold tracking-[0.18em] text-zinc-600">
                      PLAN
                    </p>

                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-base font-bold">
                        {account?.planName || "SYNCING..."}
                      </p>

                      <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[7px] font-semibold text-zinc-500">
                        {account?.plan || "FREE"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[8px] font-bold tracking-[0.15em] text-zinc-600">
                      REMAINING
                    </p>

                    <p className="mt-1 font-mono text-sm font-bold text-cyan-300">
                      {account?.plan === "premium"
                        ? "UNLIMITED"
                        : account?.accessLocked
                          ? "LOCKED"
                          : account?.trialActive
                            ? "ACTIVE"
                            : "—"}
                    </p>
                  </div>

                </div>

                <div className="mt-4">

                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[8px] text-zinc-600">
                      Monthly usage
                    </span>

                    <span className="font-mono text-[9px] text-zinc-500">
                      {account?.plan === "premium"
                        ? "UNLIMITED ACCESS"
                        : account?.trialActive
                          ? "3-DAY FREE TRIAL"
                          : account?.accessLocked
                            ? "TRIAL ENDED"
                            : "SYNCING..."}
                    </span>
                  </div>

                  <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        account?.accessLocked
                          ? "w-0 bg-red-400/60"
                          : account?.plan === "premium"
                            ? "w-full bg-amber-400/70"
                            : "w-full bg-cyan-400/60"
                      }`}
                    />
                  </div>

                </div>

              </div>

              {/* PREMIUM */}
              <div className="rounded-2xl border border-amber-400/10 bg-amber-400/[0.018] p-4">

                <div className="flex items-center justify-between gap-3">

                  <div className="flex min-w-0 items-center gap-2">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/15 bg-amber-400/[0.07] text-sm text-amber-300">
                      ◆
                    </div>

                    <div>
                      <p className="text-sm font-bold">
                        Premium
                      </p>

                      <p className="mt-0.5 text-[9px] text-zinc-600">
                        Unlimited setups · live intelligence
                      </p>
                    </div>

                  </div>

                  <div className="text-right">
                    <p className="font-mono text-base font-black text-amber-300">
                      $30
                    </p>

                    <p className="text-[7px] text-zinc-700">
                      / MONTH
                    </p>
                  </div>

                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">

                  <div className="rounded-xl border border-white/[0.05] bg-black/20 p-2.5">
                    <p className="text-sm font-bold">∞</p>
                    <p className="mt-0.5 text-[7px] tracking-[0.12em] text-zinc-700">
                      SETUPS
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/[0.05] bg-black/20 p-2.5">
                    <p className="text-sm font-bold text-cyan-300">LIVE</p>
                    <p className="mt-0.5 text-[7px] tracking-[0.12em] text-zinc-700">
                      DATA
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/[0.05] bg-black/20 p-2.5">
                    <p className="text-sm font-bold">30D</p>
                    <p className="mt-0.5 text-[7px] tracking-[0.12em] text-zinc-700">
                      ACCESS
                    </p>
                  </div>

                </div>

                {/* PAYMENT */}
                <div className="mt-3 rounded-xl border border-white/[0.05] bg-black/20 p-3">

                  <div className="flex items-center justify-between">
                    <p className="text-[8px] font-bold tracking-[0.15em] text-zinc-500">
                      PAY WITH USDT
                    </p>

                    <span className="text-[7px] text-zinc-700">
                      BNB CHAIN
                    </span>
                  </div>

                  <p className="mt-2 break-all font-mono text-[9px] leading-4 text-zinc-500">
                    0x1c35bf9d920e1b5d7e7e37ce1d15a1b9500f8474
                  </p>

                  <input
                    id="premium-tx-hash"
                    type="text"
                    placeholder="Transaction hash"
                    className="mt-3 w-full rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 font-mono text-[9px] text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-cyan-400/25"
                  />

                  <button
                    onClick={async () => {
                      const input =
                        document.getElementById(
                          "premium-tx-hash"
                        ) as HTMLInputElement | null;

                      const txHash =
                        input?.value.trim();

                      if (!txHash) {
                        setModal({
                            title: "TRANSACTION HASH REQUIRED",
                            message: "Paste your BNB Chain transaction hash so KitSetups can verify your payment.",
                          });
                        return;
                      }

                      try {
                        const base =
                          process.env.NEXT_PUBLIC_NART_API ||
                          "https://nart-jnr-1.onrender.com";

                        const response =
                          await fetch(
                            `${base}/api/payment/verify`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                "x-nart-user": userId,
                              },
                              body: JSON.stringify({
                                user: userId,
                                txHash,
                              }),
                            }
                          );

                        const payload =
                          await response.json();

                        if (!response.ok || !payload.ok) {
                          throw new Error(
                            payload.error ||
                            "Payment verification failed"
                          );
                        }

                        setModal({
                          title: "PAYMENT VERIFIED",
                          message: "Premium has been activated for 30 days. Your KitSetups account is now unlocked.",
                          success: true,
                        });

                        window.location.reload();
                      } catch (error) {
                        setModal({
                          title: "PAYMENT VERIFICATION FAILED",
                          message:
                            error instanceof Error
                              ? error.message
                              : "Unable to verify payment. Please check the transaction hash and try again.",
                        });
                      }
                    }}
                    className="mt-2.5 w-full rounded-xl bg-cyan-400 px-4 py-2.5 text-[8px] font-black tracking-[0.16em] text-black transition hover:bg-cyan-300 active:scale-[0.98]"
                  >
                    VERIFY PAYMENT
                  </button>

                </div>

              </div>

              {/* DEVELOPER */}
              <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">

                <div className="flex min-w-0 items-center gap-2">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-sm text-zinc-400">
                    &lt;/&gt;
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      Developer API
                    </p>

                    <p className="mt-0.5 text-[9px] text-zinc-600">
                      Connect your app to KitSetups
                    </p>
                  </div>

                </div>

                <button
                  onClick={() => {
                    setModal({
                      title: "DEVELOPER API",
                      message: "The KitSetups Developer API dashboard is being prepared. API access will be available here soon.",
                    });
                  }}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-[8px] font-bold tracking-[0.12em] text-zinc-400 transition hover:bg-white/[0.06] hover:text-zinc-200"
                >
                  VIEW
                </button>

              </div>

              {/* SIGN OUT */}
              <button
                onClick={async () => {
                  try {
                    setAuthLoading(true);
                    await signOut(auth);
                  } catch (error) {
                    console.error("❌ Sign out failed:", error);
                    setAuthError(
                      error instanceof Error
                        ? error.message
                        : "Unable to sign out. Please try again."
                    );
                  } finally {
                    setAuthLoading(false);
                  }
                }}
                disabled={authLoading}
                className="w-full rounded-2xl border border-red-400/10 bg-red-400/[0.025] px-4 py-3 text-left transition hover:border-red-400/20 hover:bg-red-400/[0.05] active:scale-[0.99] disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black tracking-[0.16em] text-red-300">
                      SIGN OUT
                    </p>

                    <p className="mt-1 text-[8px] text-zinc-600">
                      Sign out of this KitSetups account
                    </p>
                  </div>

                  <span className="text-sm text-red-300/70">
                    →
                  </span>
                </div>
              </button>

            </div>

          </section>
        )}

        {/* SETUP DETAIL */}
        {selectedSetup && (
          <section className="relative z-20 pt-8">

            <button
              type="button"
              onClick={() => setSelectedSetup(null)}
              className="mb-6 flex items-center gap-2 text-[9px] font-bold tracking-[0.16em] text-zinc-600 transition hover:text-cyan-300"
            >
              ← BACK TO SETUPS
            </button>

            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold tracking-[0.2em] text-cyan-400/70">
                  KitSetups / ANALYSIS
                </p>

                <div className="mt-2 flex items-center gap-3">
                  <h1 className="text-3xl font-black tracking-tight">
                    {(selectedSetup.pair || selectedSetup.symbol || "UNKNOWN")}
                  </h1>

                  <span
                    className={`rounded-lg px-2.5 py-1 text-[9px] font-bold ${
                      (selectedSetup.side || selectedSetup.direction || "WAIT") === "LONG"
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-red-400/10 text-red-300"
                    }`}
                  >
                    {(selectedSetup.side || selectedSetup.direction || "WAIT")}
                  </span>
                </div>

                <p className="mt-2 text-xs text-zinc-600">
                  {selectedSetup.timeframe !== "LIVE ENGINE" ? selectedSetup.timeframe : "LIVE ENGINE"}
                </p>
              </div>

              <LiveBadge />
            </div>

            {selectedSetup.premium ? (
              <div className="nart-premium-glow overflow-hidden rounded-3xl border border-amber-400/15 bg-gradient-to-br from-amber-400/[0.07] via-cyan-400/[0.025] to-transparent p-6">

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-xl">
                  ◆
                </div>

                <p className="mt-5 text-[9px] font-bold tracking-[0.2em] text-amber-300">
                  PREMIUM ANALYSIS
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  High-conviction setup detected.
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
                  This setup is reserved for Premium members. Unlock the
                  complete KitSetups analysis, execution plan and monthly setup
                  allocation.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Metric label="QUALITY" value={(selectedSetup.quality || selectedSetup.grade || "WATCH")} cyan />
                  <Metric label="R:R" value={(selectedSetup.rr || String(selectedSetup.riskReward ?? "N/A"))} cyan />
                  <Metric label="CONFIDENCE" value={(selectedSetup.confidence || "WATCH")} />
                  <Metric label="STATUS" value="LOCKED" />
                </div>

                <button
                  type="button"
                  onClick={() => goTo("profile")}
                  className="mt-6 w-full rounded-xl bg-amber-300 px-5 py-3.5 text-[10px] font-black tracking-[0.14em] text-black transition hover:bg-amber-200 active:scale-[0.98]"
                >
                  UNLOCK PREMIUM · $30 / MONTH
                </button>
              </div>
            ) : (
              <>
                <div className="nart-glow nart-card rounded-3xl border border-white/[0.06] p-5">

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Metric
                      label="ENTRY"
                      value={`$${selectedSetup.entry}`}
                    />
                    <Metric
                      label="STOP"
                      value={`$${selectedSetup.stop}`}
                    />
                    <Metric
                      label="TARGET"
                      value={`$${selectedSetup.target}`}
                      cyan
                    />
                    <Metric
                      label="R:R"
                      value={(selectedSetup.rr || String(selectedSetup.riskReward ?? "N/A"))}
                      cyan
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Metric
                      label="QUALITY"
                      value={(selectedSetup.quality || selectedSetup.grade || "WATCH")}
                      cyan
                    />
                    <Metric
                      label="CONFIDENCE"
                      value={(selectedSetup.confidence || "WATCH")}
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">

                  <div className="nart-card rounded-3xl border border-white/[0.06] p-5">
                    <p className="text-[9px] font-bold tracking-[0.18em] text-cyan-400/70">
                      MARKET STRUCTURE
                    </p>

                    <h3 className="mt-3 text-lg font-bold">
                      Structure supports {(selectedSetup.side || selectedSetup.direction || "WAIT").toLowerCase()}
                    </h3>

                    <p className="mt-3 text-xs leading-6 text-zinc-500">
                      KitSetups identified directional structure aligned with
                      the current setup. Price is being monitored for
                      confirmation around the execution zone.
                    </p>
                  </div>

                  <div className="nart-card rounded-3xl border border-white/[0.06] p-5">
                    <p className="text-[9px] font-bold tracking-[0.18em] text-cyan-400/70">
                      LIQUIDITY
                    </p>

                    <h3 className="mt-3 text-lg font-bold">
                      Liquidity condition detected
                    </h3>

                    <p className="mt-3 text-xs leading-6 text-zinc-500">
                      Liquidity behaviour is consistent with the setup
                      direction. The engine is watching for confirmation
                      before invalidation.
                    </p>
                  </div>

                </div>

                <div className="nart-card mt-4 rounded-3xl border border-cyan-400/[0.08] bg-cyan-400/[0.015] p-5">

                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-50" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                    </span>

                    <p className="text-[9px] font-bold tracking-[0.18em] text-cyan-300">
                      KitSetups THESIS
                    </p>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-zinc-400">
                    {selectedSetup.thesis}
                  </p>

                </div>

                <div className="mt-4 rounded-3xl border border-white/[0.05] bg-white/[0.015] p-5">

                  <p className="text-[9px] font-bold tracking-[0.18em] text-zinc-600">
                    EXECUTION PLAN
                  </p>

                  <div className="mt-4 space-y-3">
                    {[
                      "Wait for price to enter the execution zone.",
                      "Confirm directional structure before entry.",
                      "Risk remains defined at the invalidation level.",
                      "Target the predefined liquidity objective.",
                    ].map((step, index) => (
                      <div
                        key={step}
                        className="flex gap-3 text-xs text-zinc-500"
                      >
                        <span className="font-mono text-cyan-400/60">
                          0{index + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>

                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl border border-red-400/[0.08] bg-red-400/[0.02] px-4 py-3">
                  <span className="text-[8px] font-bold tracking-[0.16em] text-red-400/70">
                    INVALIDATION
                  </span>

                  <span className="font-mono text-xs text-zinc-500">
                    ${selectedSetup.stop}
                  </span>
                </div>
              </>
            )}

          </section>
        )}

        {/* T3KIT FLOATING PROMO */}
        {showT3KitPromo && (
          <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[9998] flex justify-center px-4">
            <div className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-orange-400/20 bg-[#090b0d]/95 p-3 shadow-2xl backdrop-blur-xl">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-orange-400/15 bg-orange-400/[0.06]">
                <img
                  src="https://www.t3kit.xyz/assets/images/logo.webp"
                  alt="T3Kit"
                  className="h-7 w-7 object-contain"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-mono text-[7px] font-bold tracking-[0.18em] text-orange-400">
                  T3KIT
                </p>
                <p className="mt-1 text-xs font-bold text-white">
                  Your gateway into Web3.
                </p>
                <p className="mt-0.5 text-[9px] text-zinc-500">
                  Learn. Build. Find opportunities.
                </p>
              </div>

              <a
                href="https://www.t3kit.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-xl bg-orange-400 px-3 py-2 text-[8px] font-black tracking-[0.12em] text-black transition hover:bg-orange-300"
              >
                EXPLORE
              </a>

            </div>
          </div>
        )}

        {/* APP MODAL */}
        {modal && (
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 px-5 backdrop-blur-md"
            onClick={() => setModal(null)}
          >
            <div
              className="w-full max-w-sm rounded-[26px] border border-white/[0.08] bg-[#090b0d] p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-2">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                    modal.success
                      ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300"
                      : "border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300"
                  }`}>
                    {modal.success ? "✓" : "◆"}
                  </div>

                  <div>
                    <p className="font-mono text-[8px] font-bold tracking-[0.2em] text-zinc-600">
                      KITSETUPS
                    </p>
                    <h3 className="mt-1 text-sm font-bold text-white">
                      {modal.title}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-lg text-zinc-600 hover:bg-white/[0.05] hover:text-zinc-300"
                >
                  ×
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4">
                <p className="text-xs leading-5 text-zinc-400">
                  {modal.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const reload = modal.success;
                  setModal(null);
                  if (reload) window.location.reload();
                }}
                className={`mt-4 w-full rounded-xl px-4 py-3 text-[8px] font-black tracking-[0.16em] text-black ${
                  modal.success
                    ? "bg-emerald-400 hover:bg-emerald-300"
                    : "bg-cyan-400 hover:bg-cyan-300"
                }`}
              >
                {modal.success ? "CONTINUE TO KITSETUPS" : "GOT IT"}
              </button>
            </div>
          </div>
        )}

        {/* BOTTOM NAV */}
        <nav className="pointer-events-auto fixed bottom-4 left-1/2 z-[9999] flex w-[calc(100%-32px)] max-w-lg -translate-x-1/2 items-center justify-around rounded-2xl border border-white/[0.08] bg-[#090b0d]/95 p-2 shadow-2xl backdrop-blur-xl">
          {[
            ["home", "⌂", "Home"],
            ["setups", "◈", "Setups"],
            ["analysis", "◌", "Analysis"],
            ["profile", "◎", "Profile"],
          ].map(([key, icon, label]) => (
            <button
              key={key}
              onClick={() => goTo(key as Tab)}
              className={`relative flex min-w-[70px] flex-col items-center gap-1 rounded-xl px-3 py-2 transition active:scale-95 ${
                tab === key
                  ? "bg-cyan-400/10 text-cyan-300"
                  : "text-zinc-600 hover:text-zinc-300"
              }`}
            >
              <span className="text-base">{icon}</span>
              <span className="text-[8px] font-semibold tracking-[0.12em]">
                {label}
              </span>

              {tab === key && (
                <span className="absolute bottom-0 h-0.5 w-5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              )}
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
}
