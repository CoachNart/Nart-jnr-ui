"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Crosshair, RefreshCw } from "lucide-react";
import StandaloneShell from "./standalone-shell";
import { auth } from "../lib/firebase";
import { kitsetupsAuthFetch } from "../lib/api";

type Signal = any;

const fmt = (value: unknown, digits = 2) => {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: digits }) : "—";
};

const text = (value: unknown) => String(value || "—").replaceAll("_", " ").toUpperCase();

const lifecycleStatus = (signal: Signal) =>
  String(signal?.lifecycle?.status || signal?.signalState || signal?.status || "WAIT").toUpperCase();

const lifecycleTone = (status: string) => {
  if (status === "STOP_LOSS") return "text-red-300 border-red-400/15 bg-red-400/[.04]";
  if (status === "MISSED") return "text-amber-300 border-amber-400/15 bg-amber-400/[.04]";
  if (status === "EXPIRED") return "text-zinc-400 border-zinc-700/60 bg-zinc-800/20";
  if (["ENTRY_HIT", "TP1_HIT", "TP2_HIT", "TP3_HIT"].includes(status)) return "text-emerald-300 border-emerald-400/15 bg-emerald-400/[.04]";
  if (status === "ACTIVE") return "text-cyan-300 border-cyan-400/15 bg-cyan-400/[.04]";
  return "text-zinc-300 border-zinc-700/60 bg-zinc-800/20";
};

function targets(signal: Signal) {
  return Array.isArray(signal?.targets) ? signal.targets.slice(0, 3) : [];
}

function Lifecycle({ signal }: { signal: Signal }) {
  const lifecycle = signal?.lifecycle || {};
  const status = lifecycleStatus(signal);
  const targetStates = Array.isArray(lifecycle.targets) ? lifecycle.targets : [];
  const entryHit = lifecycle.entryHit === true || ["ENTRY_HIT", "ACTIVE", "TP1_HIT", "TP2_HIT", "TP3_HIT", "STOP_LOSS", "CLOSED"].includes(status);
  const active = ["ACTIVE", "TP1_HIT", "TP2_HIT", "TP3_HIT"].includes(status);
  const steps = [
    { key: "READY", label: "READY", complete: ["ENTRY_HIT", "ACTIVE", "TP1_HIT", "TP2_HIT", "TP3_HIT", "STOP_LOSS", "CLOSED"].includes(status) },
    { key: "ENTRY_HIT", label: "ENTRY", complete: entryHit },
    { key: "ACTIVE", label: "ACTIVE", complete: active },
    { key: "TP1_HIT", label: "TP1", complete: targetStates[0]?.hit === true || ["TP1_HIT", "TP2_HIT", "TP3_HIT"].includes(status) },
    { key: "TP2_HIT", label: "TP2", complete: targetStates[1]?.hit === true || ["TP2_HIT", "TP3_HIT"].includes(status) },
    { key: "TP3_HIT", label: "TP3", complete: targetStates[2]?.hit === true || status === "TP3_HIT" },
    { key: "CLOSED", label: "CLOSED", complete: status === "CLOSED" },
  ];
  const terminal = ["STOP_LOSS", "MISSED", "EXPIRED"].includes(status);

  return (
    <div className="mt-5 rounded-2xl border border-zinc-900 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[7px] tracking-[.18em] text-zinc-600">LIFECYCLE</p>
          <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 font-mono text-[8px] tracking-[.1em] ${lifecycleTone(status)}`}>
            {text(status)}
          </span>
        </div>
        {lifecycle?.outcome ? <span className="font-mono text-[7px] tracking-[.12em] text-zinc-600">{text(lifecycle.outcome)}</span> : null}
      </div>

      <div className="mt-5 flex items-center gap-1 overflow-x-auto pb-1">
        {steps.map((step, index) => (
          <div key={step.key} className="flex shrink-0 items-center gap-1">
            <span className={`rounded-full border px-2.5 py-1.5 font-mono text-[7px] tracking-[.08em] ${step.complete ? "border-emerald-400/20 bg-emerald-400/[.045] text-emerald-300" : status === step.key ? "border-cyan-400/20 bg-cyan-400/[.045] text-cyan-300" : "border-zinc-900 text-zinc-700"}`}>
              {step.label}
            </span>
            {index < steps.length - 1 ? <span className="text-zinc-800">→</span> : null}
          </div>
        ))}
      </div>

      {terminal ? (
        <div className={`mt-3 rounded-xl border px-3 py-2 font-mono text-[8px] tracking-[.08em] ${lifecycleTone(status)}`}>
          {text(status)}
        </div>
      ) : null}
    </div>
  );
}

function TradeMetric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "entry" | "stop" | "target" }) {
  const toneClass = tone === "entry" || tone === "target" ? "text-emerald-300" : tone === "stop" ? "text-red-300" : "text-zinc-100";
  return (
    <div className="rounded-2xl border border-zinc-900 bg-[#090b0d] px-4 py-4">
      <p className="font-mono text-[7px] tracking-[.18em] text-zinc-600">{label}</p>
      <p className={`mt-2 text-base font-semibold tracking-tight ${toneClass}`}>{value}</p>
    </div>
  );
}

function SetupCard({ signal, hasAccess }: { signal: Signal; hasAccess: boolean }) {
  const direction = String(signal?.direction || "").toUpperCase();
  const ts = targets(signal);
  const id = signal?.signalId || signal?.id;
  const confidence = signal?.quality?.confidence || "—";
  const grade = signal?.quality?.grade || "—";
  const status = lifecycleStatus(signal);
  const preview = signal?.thesis?.structural || signal?.thesis?.entry || signal?.reasons?.[0] || "Live setup awaiting a concise engine thesis.";
  const currentPrice = signal?.price;

  return (
    <article className="overflow-hidden rounded-[28px] border border-zinc-800/90 bg-[#07090b] shadow-[0_24px_80px_rgba(0,0,0,.22)]">
      <div className="p-5 sm:p-6">
        <header className="flex items-start justify-between gap-4 border-b border-zinc-900 pb-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="text-2xl font-semibold tracking-[-.04em] text-zinc-100">{signal?.symbol || "—"}</h2>
              <span className={`text-sm font-semibold ${direction === "LONG" ? "text-emerald-300" : direction === "SHORT" ? "text-red-300" : "text-zinc-500"}`}>{direction || "WATCH"}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-zinc-800 bg-zinc-900/40 px-2.5 py-1 font-mono text-[7px] tracking-[.13em] text-zinc-400">{text(signal?.setupType || "SETUP")}</span>
              <span className={`rounded-full border px-2.5 py-1 font-mono text-[7px] tracking-[.13em] ${lifecycleTone(status)}`}>{text(status)}</span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-[7px] tracking-[.16em] text-zinc-600">CURRENT MARKET PRICE</p>
            <p className="mt-1 text-base font-semibold text-zinc-100">{fmt(currentPrice)}</p>
          </div>
        </header>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <TradeMetric label="ENTRY" value={hasAccess ? `$${fmt(signal?.entry)}` : "PROTECTED"} tone="entry" />
          <TradeMetric label="STOP LOSS" value={hasAccess ? `$${fmt(signal?.stop)}` : "PROTECTED"} tone="stop" />
          <TradeMetric label="TP1" value={hasAccess ? `$${fmt(ts[0]?.price)}` : "PROTECTED"} tone="target" />
          <TradeMetric label="TP2" value={hasAccess ? `$${fmt(ts[1]?.price)}` : "PROTECTED"} tone="target" />
          <TradeMetric label="TP3" value={hasAccess ? `$${fmt(ts[2]?.price)}` : "PROTECTED"} tone="target" />
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <TradeMetric label="RISK" value={hasAccess && Number.isFinite(Number(signal?.risk)) ? `${fmt(signal.risk)} pts` : "—"} />
          <TradeMetric label="TP1 RR" value={hasAccess && ts[0]?.riskReward != null ? `${fmt(ts[0].riskReward)} R` : "—"} />
          <TradeMetric label="TP2 RR" value={hasAccess && ts[1]?.riskReward != null ? `${fmt(ts[1].riskReward)} R` : "—"} />
          <TradeMetric label="TP3 RR" value={hasAccess && ts[2]?.riskReward != null ? `${fmt(ts[2].riskReward)} R` : "—"} />
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
          <div className="rounded-2xl border border-zinc-900 bg-black/20 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[7px] tracking-[.18em] text-zinc-600">CONFIDENCE</p>
                <p className="mt-1 text-sm font-semibold text-zinc-100">{text(confidence)}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[7px] tracking-[.18em] text-zinc-600">GRADE</p>
                <p className="mt-1 text-sm font-semibold text-cyan-200">{grade}</p>
              </div>
            </div>
          </div>
          <Link href={`/setups/${encodeURIComponent(id || signal?.symbol || "setup")}`} className="group flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.045] px-5 text-xs font-semibold text-cyan-200 transition hover:border-cyan-300/30 hover:bg-cyan-300/[.075]">
            View Full Analysis <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <p className="mt-4 line-clamp-2 text-xs leading-5 text-zinc-500">{preview}</p>
        <Lifecycle signal={signal} />
      </div>
    </article>
  );
}

export default function SetupsPageView() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [scanner, setScanner] = useState<Signal>(null);
  const [access, setAccess] = useState<Signal>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (silent = false) => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      setError("Sign in to view live setups.");
      return;
    }
    silent ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const response = await kitsetupsAuthFetch("/api/signals", token);
      const body = await response.json();
      if (!response.ok || !body?.ok) throw new Error(body?.error || "Unable to load setups");
      const data = body.data || {};
      setSignals(Array.isArray(data.signals) ? data.signals : Array.isArray(data.scanResults) ? data.scanResults : []);
      setScanner(data.scanner || null);
      setAccess(data.access || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load live setups.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const boot = async () => {
      await auth.authStateReady();
      if (mounted) await load();
    };
    void boot();
    const interval = window.setInterval(() => {
      if (auth.currentUser) void load(true);
    }, 15000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [load]);

  const visible = [...signals].sort((a, b) => Number(b?.quality?.score || 0) - Number(a?.quality?.score || 0));
  const hasAccess = Boolean(access?.hasAccess);

  return (
    <StandaloneShell title="SETUPS">
      <section className="mb-7 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Trading Setups</h1>
          <p className="mt-1 text-xs text-zinc-600">Execution-ready trade tickets from the live engine.</p>
        </div>
        <button onClick={() => void load(true)} disabled={loading || refreshing} aria-label="Refresh setups" className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-500 transition hover:border-cyan-400/20 hover:text-cyan-300 disabled:opacity-40">
          <RefreshCw className={refreshing ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
        </button>
      </section>

      {error ? <div className="mb-5 rounded-2xl border border-amber-500/15 bg-amber-500/[.035] p-4 text-xs text-amber-300">{error}</div> : null}

      {loading && !signals.length ? (
        <div className="h-96 animate-pulse rounded-3xl border border-zinc-900 bg-zinc-950/70" />
      ) : visible.length ? (
        <div className="space-y-4">
          {visible.map((signal, index) => <SetupCard key={signal?.signalId || signal?.symbol || index} signal={signal} hasAccess={hasAccess} />)}
        </div>
      ) : (
        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 px-5 py-16 text-center">
          <Crosshair className="mx-auto h-6 w-6 text-zinc-700" />
          <h3 className="mt-4 text-sm font-medium text-zinc-300">No published setup</h3>
          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-zinc-600">A trade ticket appears when the engine publishes a coherent opportunity.</p>
        </div>
      )}

      <p className="mt-4 text-right font-mono text-[7px] tracking-[.14em] text-zinc-700">LIVE ENGINE{scanner?.updatedAt ? ` · ${new Date(scanner.updatedAt).toLocaleTimeString()}` : ""}</p>
    </StandaloneShell>
  );
}
