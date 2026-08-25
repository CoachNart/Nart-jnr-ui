"use client";

import { useEffect, useState } from "react";
import { useUser, useClerk, useAuth } from "@clerk/nextjs";
import { initAnalytics } from "@/lib/firebase";

type Tab = "home" | "setups" | "analysis" | "profile";

type NartSetup = {
  symbol: string;
  price?: number | string;
  direction?: string;
  entry?: number | null;
  stop?: number | null;
  target?: number | null;
  riskReward?: number | string | null;
  status?: string;
  stage?: string;
  grade?: string;
  score?: number | string | null;
  confidence?: string | null;
  timeframe?: string | null;
  bias?: string;
  reason?: string[];
  entryZone?: {
    timeframe?: string | null;
  } | null;
  tradePlan?: {
    bias?: string;
    direction?: string;
    status?: string;
    stage?: string;
    grade?: string;
    score?: number | null;
    confidence?: string;
    entry?: number | null;
    stop?: number | null;
    target?: number | null;
    riskReward?: number | string | null;
    reason?: string[];
    entryZone?: {
      timeframe?: string | null;
    } | null;
  };
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


const setups = [
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
        LIVE FEED
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
  return value === "READY" || value === "ARMED" || value === "ACTIVE";
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
  };
  onOpen: () => void;
  signalLocked?: boolean;
}) {
  const locked = setup.premium || signalLocked;
  const bullish = setup.side === "LONG";
  const status = getSetupStatus(setup.status);
  const watchOnly = isWatchStatus(status);
  const executionStatus = isExecutionStatus(status);

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
                {setup.pair.replace("USDT", "")}/USDT
              </span>

            </div>

          </div>

          {!watchOnly && executionStatus && (
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
  const { user, isLoaded } = useUser();
  const { signOut, openSignIn } = useClerk();
  const { getToken } = useAuth();

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
    if (!isLoaded) return;

    initAnalytics().catch((error) => {
      console.error("❌ Firebase Analytics failed:", error);
    });

    if (user) {
      const clerkUser = {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        displayName: user.fullName || user.username || null,
        photoURL: user.imageUrl || null,
      };

      setAuthUser(clerkUser);
      setUserId(user.id);
      setAuthError(null);
    } else {
      setAuthUser(null);
      setUserId("");
      setAccount(null);
    }

    setAuthLoading(false);
  }, [user, isLoaded]);

  async function getClerkToken() {
    try {
      const token = await getToken();
      return token || null;
    } catch (error) {
      console.error("❌ Clerk token retrieval failed:", error);
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

        const token = await getClerkToken();

        if (!token) {
          throw new Error("Authentication token unavailable");
        }

        const response = await fetch(`${base}/api/account`, {
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
{/* T3KIT FLOATING PROMO */}
<a
  href="https://t3kit.xyz"
  target="_blank"
  rel="noopener noreferrer"
  className="group fixed bottom-5 left-1/2 z-50 w-[calc(100%-24px)] max-w-[380px] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080808]/95 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.14]"
>
  <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03]">
      <img
        src="https://www.t3kit.xyz/assets/images/logo.webp"
        alt="T3Kit"
        className="h-7 w-7 object-contain"
      />
    </div>

    <div className="min-w-0 flex-1">
      <p className="font-mono text-[7px] font-bold tracking-[0.16em] text-cyan-400">
        T3KIT · WEB3 ECOSYSTEM
      </p>

      <p className="mt-1 text-sm font-semibold tracking-tight text-white">
        Looking to build a career in Web3?
      </p>

      <p className="mt-1 font-mono text-[7px] tracking-[0.08em] text-zinc-500">
        Learn. Build. Find opportunities.
      </p>
    </div>

    <span className="shrink-0 rounded-lg border border-cyan-400/20 bg-cyan-400/[0.06] px-2.5 py-2 font-mono text-[7px] font-bold tracking-[0.12em] text-cyan-300 transition group-hover:bg-cyan-400/[0.1]">
      VISIT T3KIT ↗
    </span>
  </div>
</a>
) => {
      cancelled = true;
    };
  }, [userId, getToken]);

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

        const token = await getClerkToken();

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

        const token = await getClerkToken();

        console.log("KITSETUPS AUTH DEBUG:", {
          uid: userId,
          email: authUser.email,
          hasToken: !!token,
          tokenLength: token?.length || 0,
        });

        if (!token) {
          throw new Error("Authentication token unavailable");
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
          setApiError(
            error instanceof Error
              ? error.message
              : "Failed to load signals"
          );
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

      await openSignIn({
        forceRedirectUrl: window.location.href,
      });
    } catch (error) {
      console.error("❌ Clerk Google sign-in failed:", error);

      if (error instanceof Error) {
        setAuthError(error.message);
      } else {
        setAuthError("Google sign-in failed. Please try again.");
      }

      setAuthLoading(false);
    }
  }

  async function logout() {
    try {
      await signOut();
    } catch (error) {
      console.error("❌ Clerk logout failed:", error);
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
        const status =
          String(
            item.status ||
            plan.status ||
            "DEVELOPING"
          ).toUpperCase();

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
        )}

        {/* ANALYSIS */}
        {tab === "analysis" && !selectedSetup && (
          <section className="py-8">

            <div className="mb-6">
              <p className="text-[9px] font-semibold tracking-[0.2em] text-cyan-400/60">
                ENGINE OUTPUT
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Market Analysis
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
                Live market intelligence generated by the KitSetups engine.
              </p>
            </div>

            {liveAnalysis?.tradePlan ? (
              <div className="space-y-4">

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Metric
                    label="BIAS"
                    value={
                      liveAnalysis.tradePlan.bias
                        ? liveAnalysis.tradePlan.bias.toUpperCase()
                        : "—"
                    }
                    cyan
                  />

                  <Metric
                    label="DIRECTION"
                    value={
                      liveAnalysis.tradePlan.direction || "—"
                    }
                  />

                  <Metric
                    label="STATUS"
                    value={
                      liveAnalysis.tradePlan.status || "—"
                    }
                  />

                  <Metric
                    label="R:R"
                    value={
                      liveAnalysis.tradePlan.riskReward != null
                        ? `${liveAnalysis.tradePlan.riskReward}R`
                        : "—"
                    }
                    cyan
                  />
                </div>

                <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-semibold tracking-[0.18em] text-zinc-600">
                        KitSetups REASONING
                      </p>

                      <h3 className="mt-1 text-lg font-bold">
                        Why we're watching BTCUSDT
                      </h3>
                    </div>

                    <LiveBadge />
                  </div>

                  <div className="mt-5 space-y-3">
                    {(liveAnalysis.tradePlan.reason || []).map(
                      (reason, index) => (
                        <div
                          key={index}
                          className="flex gap-3 rounded-2xl border border-white/[0.05] bg-black/20 p-3.5"
                        >
                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]" />

                          <p className="text-sm leading-6 text-zinc-400">
                            {reason}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                  <Metric
                    label="ENTRY"
                    value={
                      liveAnalysis.tradePlan.entry != null
                        ? `$${Number(
                            liveAnalysis.tradePlan.entry
                          ).toLocaleString()}`
                        : "WAIT"
                    }
                  />

                  <Metric
                    label="STOP"
                    value={
                      liveAnalysis.tradePlan.stop != null
                        ? `$${Number(
                            liveAnalysis.tradePlan.stop
                          ).toLocaleString()}`
                        : "WAIT"
                    }
                  />

                  <Metric
                    label="TARGET"
                    value={
                      liveAnalysis.tradePlan.target != null
                        ? `$${Number(
                            liveAnalysis.tradePlan.target
                          ).toLocaleString()}`
                        : "WAIT"
                    }
                    cyan
                  />

                </div>

              </div>
            ) : (
              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                <p className="text-sm text-zinc-500">
                  {apiLoading
                    ? "Synchronizing with KitSetups engine..."
                    : analysisError
                      ? `Analysis: ${analysisError}`
                      : "Analysis unavailable."}
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
                    {selectedSetup.pair}
                  </h1>

                  <span
                    className={`rounded-lg px-2.5 py-1 text-[9px] font-bold ${
                      selectedSetup.side === "LONG"
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-red-400/10 text-red-300"
                    }`}
                  >
                    {selectedSetup.side}
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
                  <Metric label="QUALITY" value={selectedSetup.quality} cyan />
                  <Metric label="R:R" value={selectedSetup.rr} cyan />
                  <Metric label="CONFIDENCE" value={selectedSetup.confidence} />
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
                      value={selectedSetup.rr}
                      cyan
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Metric
                      label="QUALITY"
                      value={selectedSetup.quality}
                      cyan
                    />
                    <Metric
                      label="CONFIDENCE"
                      value={selectedSetup.confidence}
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">

                  <div className="nart-card rounded-3xl border border-white/[0.06] p-5">
                    <p className="text-[9px] font-bold tracking-[0.18em] text-cyan-400/70">
                      MARKET STRUCTURE
                    </p>

                    <h3 className="mt-3 text-lg font-bold">
                      Structure supports {selectedSetup.side.toLowerCase()}
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
