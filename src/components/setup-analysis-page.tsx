"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, RefreshCw, ShieldAlert, Target } from "lucide-react";
import StandaloneShell from "./standalone-shell";
import { auth } from "../lib/firebase";
import { kitsetupsAuthFetch } from "../lib/api";

type Signal = any;

const fmt = (value: unknown, digits = 2) => {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: digits }) : "—";
};
const text = (value: unknown) => String(value || "—").replaceAll("_", " ").toUpperCase();
const lifecycle = (signal: Signal) => String(signal?.lifecycle?.status || signal?.signalState || signal?.status || "WAIT").toUpperCase();
const field = (...values: unknown[]) => values.find((value) => value !== undefined && value !== null && value !== "") ?? "—";

function tone(status: string) {
  if (status === "STOP_LOSS") return "border-red-400/15 bg-red-400/[.04] text-red-300";
  if (["ENTRY_HIT", "TP1_HIT", "TP2_HIT", "TP3_HIT"].includes(status)) return "border-emerald-400/15 bg-emerald-400/[.04] text-emerald-300";
  if (status === "ACTIVE") return "border-cyan-400/15 bg-cyan-400/[.04] text-cyan-300";
  if (status === "MISSED") return "border-amber-400/15 bg-amber-400/[.04] text-amber-300";
  return "border-zinc-800 bg-zinc-900/30 text-zinc-300";
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-zinc-900 bg-[#080a0c] p-5 sm:p-6 ${className}`}><div className="mb-5 flex items-center justify-between"><h2 className="text-sm font-semibold tracking-tight text-zinc-100">{title}</h2></div>{children}</section>;
}

function Row({ label, value, accent = false }: { label: string; value: unknown; accent?: boolean }) {
  return <div className="rounded-2xl border border-zinc-900 bg-black/20 px-4 py-3"><p className="font-mono text-[7px] tracking-[.16em] text-zinc-600">{label}</p><p className={`mt-1.5 text-sm font-medium ${accent ? "text-cyan-200" : "text-zinc-300"}`}>{String(value ?? "—")}</p></div>;
}

function Lifecycle({ signal }: { signal: Signal }) {
  const status = lifecycle(signal);
  const lc = signal?.lifecycle || {};
  const targets = Array.isArray(lc.targets) ? lc.targets : [];
  const steps = [
    ["READY", status !== "READY"],
    ["ENTRY", lc.entryHit === true],
    ["ACTIVE", status === "ACTIVE" || ["TP1_HIT", "TP2_HIT", "TP3_HIT"].includes(status)],
    ["TP1", targets[0]?.hit === true],
    ["TP2", targets[1]?.hit === true],
    ["TP3", targets[2]?.hit === true],
    ["CLOSED", status === "CLOSED"],
  ];
  return <Card title="Lifecycle"><div className="flex items-center gap-1 overflow-x-auto pb-1">{steps.map(([label, complete], index) => <div key={String(label)} className="flex shrink-0 items-center gap-1"><span className={`rounded-full border px-3 py-1.5 font-mono text-[7px] tracking-[.1em] ${complete ? "border-emerald-400/20 bg-emerald-400/[.04] text-emerald-300" : status === label ? "border-cyan-400/20 bg-cyan-400/[.04] text-cyan-300" : "border-zinc-900 text-zinc-700"}`}>{label}</span>{index < steps.length - 1 ? <span className="text-zinc-800">→</span> : null}</div>)}</div><div className="mt-4 flex flex-wrap items-center gap-2"><span className={`rounded-full border px-3 py-1.5 font-mono text-[8px] tracking-[.1em] ${tone(status)}`}>{text(status)}</span>{lc.outcome ? <span className="font-mono text-[8px] tracking-[.1em] text-zinc-600">OUTCOME · {text(lc.outcome)}</span> : null}</div></Card>;
}

function TimeframeAnalysis({ signal }: { signal: Signal }) {
  const context = signal?.analysis?.context || signal?.context || {};
  const structures = signal?.analysis?.structures || signal?.structures || {};
  const momentum = signal?.analysis?.momentum || signal?.momentum || {};
  const frames = ["1w", "1d", "4h", "1h", "30m"];
  const hierarchy: Record<string, string> = { "1w": "MACRO", "1d": "PRIMARY", "4h": "INTERMEDIATE", "1h": "TRADE", "30m": "EXECUTION" };
  return <Card title="Market Context"><div className="space-y-2">{frames.map((tf) => { const c = context?.timeframes?.[tf] || {}; const s = structures?.[tf] || {}; const m = momentum?.[tf] || momentum?.timeframes?.[tf] || {}; return <div key={tf} className={`rounded-2xl border px-4 py-4 ${tf === String(signal?.timeframe || "30m").toLowerCase() ? "border-cyan-300/15 bg-cyan-300/[.025]" : "border-zinc-900 bg-black/10"}`}><div className="flex items-center justify-between gap-3"><div><span className="font-mono text-[9px] font-semibold text-zinc-300">{tf.toUpperCase()}</span><span className="ml-2 font-mono text-[7px] tracking-[.14em] text-zinc-600">{hierarchy[tf]}</span></div><span className="font-mono text-[7px] tracking-[.12em] text-zinc-600">{text(field(c?.regime, c?.marketRegime, signal?.marketRegime))}</span></div><div className="mt-3 grid grid-cols-3 gap-2"><Row label="TREND" value={text(field(c?.trend, s?.direction))}/><Row label="STRUCTURE" value={text(field(s?.structure, s?.breaks?.latest?.kind))}/><Row label="MOMENTUM" value={text(field(m?.direction, m?.bias))}/></div><p className="mt-3 text-xs leading-5 text-zinc-500">{field(c?.context, c?.summary, c?.reason, s?.summary, m?.summary)}</p></div>; })}</div></Card>;
}

function StructureAnalysis({ signal }: { signal: Signal }) {
  const structures = signal?.analysis?.structures || signal?.structures || {};
  const active = structures?.[String(signal?.timeframe || "30m").toLowerCase()] || structures?.["30m"] || {};
  const latestBreak = active?.breaks?.latest || {};
  const list = (value: unknown) => Array.isArray(value) ? value : [];
  const points = (key: string) => list(active?.[key]).map((item: any) => `${fmt(item?.price ?? item?.level)}${item?.type ? ` · ${text(item.type)}` : ""}`).join("  •  ") || "—";
  return <Card title="Structure Analysis"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"><Row label="CURRENT STRUCTURE" value={text(field(active?.structure, active?.direction, active?.trend))}/><Row label="BOS" value={text(field(active?.bos, latestBreak?.kind === "BOS" ? latestBreak?.kind : undefined))}/><Row label="CHoCH" value={text(field(active?.choch, latestBreak?.kind === "CHoCH" ? latestBreak?.kind : undefined))}/><Row label="PROTECTED HIGH" value={fmt(field(active?.protectedHigh?.price, active?.protectedHigh?.level))}/><Row label="PROTECTED LOW" value={fmt(field(active?.protectedLow?.price, active?.protectedLow?.level))}/><Row label="STRUCTURAL BREAK" value={fmt(field(latestBreak?.level, latestBreak?.price))}/><Row label="BREAK TYPE" value={text(field(latestBreak?.kind, latestBreak?.type))}/><Row label="INTERNAL" value={text(field(active?.internal?.structure, active?.internal?.direction))}/><Row label="EXTERNAL" value={text(field(active?.external?.structure, active?.external?.direction))}/></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><div className="rounded-2xl border border-zinc-900 bg-black/10 px-4 py-4"><p className="font-mono text-[7px] tracking-[.16em] text-zinc-600">HIGHER HIGHS / LOWER HIGHS</p><p className="mt-2 text-xs leading-5 text-zinc-400">{points("highs")}</p></div><div className="rounded-2xl border border-zinc-900 bg-black/10 px-4 py-4"><p className="font-mono text-[7px] tracking-[.16em] text-zinc-600">HIGHER LOWS / LOWER LOWS</p><p className="mt-2 text-xs leading-5 text-zinc-400">{points("lows")}</p></div></div><p className="mt-4 text-xs leading-5 text-zinc-500">{field(active?.invalidation, active?.structuralInvalidation, signal?.thesis?.invalidation)}</p></Card>;
}

function LiquidityAnalysis({ signal }: { signal: Signal }) {
  const liquidity = signal?.analysis?.liquidity || signal?.liquidity || {};
  const groups = [
    ["BUY-SIDE LIQUIDITY", liquidity?.buySide, liquidity?.buySideLiquidity],
    ["SELL-SIDE LIQUIDITY", liquidity?.sellSide, liquidity?.sellSideLiquidity],
    ["EQH", liquidity?.eqh, liquidity?.equalHighs],
    ["EQL", liquidity?.eql, liquidity?.equalLows],
    ["SWEPT", liquidity?.swept, liquidity?.sweptLiquidity],
    ["UNSWEPT", liquidity?.unswept, liquidity?.unsweptLiquidity],
  ];
  const render = (items: unknown) => { const arr = Array.isArray(items) ? items : items ? [items] : []; return arr.slice(0, 6).map((item: any, i) => <div key={i} className="flex items-center justify-between rounded-xl border border-zinc-900 bg-black/10 px-3 py-2.5"><span className="text-xs text-zinc-400">{fmt(item?.price ?? item?.level ?? item?.value)}</span><span className="font-mono text-[7px] tracking-[.1em] text-zinc-600">{text(field(item?.timeframe, item?.type, item?.class))}</span></div>); };
  return <Card title="Liquidity Analysis"><div className="grid gap-3 sm:grid-cols-2">{groups.map(([title, a, b]) => <div key={String(title)} className="rounded-2xl border border-zinc-900 bg-black/10 p-4"><p className="font-mono text-[7px] tracking-[.16em] text-zinc-600">{title}</p><div className="mt-3 space-y-1.5">{render(a || b)}{!a && !b ? <p className="text-xs text-zinc-700">Not supplied by engine.</p> : null}</div></div>)}</div><div className="mt-3 grid gap-2 sm:grid-cols-3"><Row label="NEAREST MEANINGFUL" value={fmt(field(liquidity?.nearestMeaningful?.price, liquidity?.nearest?.price, liquidity?.nearestMeaningful))}/><Row label="NEXT MEANINGFUL" value={fmt(field(liquidity?.nextMeaningful?.price, liquidity?.next?.price, liquidity?.nextMeaningful))}/><Row label="EXTERNAL LIQUIDITY" value={fmt(field(liquidity?.external?.price, liquidity?.externalLiquidity?.price, liquidity?.external))}/></div><p className="mt-4 text-xs leading-5 text-zinc-500">{field(liquidity?.summary, liquidity?.reason, signal?.thesis?.liquidity)}</p></Card>;
}

function EntryStopTargets({ signal }: { signal: Signal }) {
  const targets = Array.isArray(signal?.targets) ? signal.targets.slice(0, 3) : [];
  const entry = signal?.entry;
  const stop = signal?.stop;
  const entryAnalysis = signal?.analysis?.entry || signal?.entryAnalysis || {};
  const stopAnalysis = signal?.analysis?.stop || signal?.stopAnalysis || {};
  return <div className="grid gap-4 lg:grid-cols-2"><Card title="Entry Analysis"><div className="grid gap-2 sm:grid-cols-2"><Row label="ENTRY MODEL" value={text(field(entryAnalysis?.model, signal?.setupType))} accent/><Row label="EXECUTION TIMEFRAME" value={text(field(entryAnalysis?.timeframe, signal?.timeframe))}/><Row label="ENTRY PRICE" value={`$${fmt(entry)}`} accent/><Row label="BREAK LEVEL" value={`$${fmt(field(entryAnalysis?.breakLevel, entryAnalysis?.level))}`}/></div><div className="mt-3 rounded-2xl border border-zinc-900 bg-black/10 p-4"><p className="font-mono text-[7px] tracking-[.16em] text-zinc-600">CONFIRMATION</p><p className="mt-2 text-xs leading-5 text-zinc-400">{field(entryAnalysis?.confirmation, entryAnalysis?.reason, signal?.thesis?.entry)}</p></div></Card><Card title="Stop Analysis"><div className="grid gap-2 sm:grid-cols-2"><Row label="STOP PRICE" value={`$${fmt(stop)}`}/><Row label="STRUCTURAL LEVEL" value={`$${fmt(field(stopAnalysis?.protectedLevel, stopAnalysis?.level))}`}/><Row label="DISTANCE" value={signal?.risk != null ? `${fmt(signal.risk)} pts` : "—"}/><Row label="INVALIDATION" value={text(field(stopAnalysis?.type, stopAnalysis?.reason))}/></div><div className="mt-3 rounded-2xl border border-red-400/10 bg-red-400/[.025] p-4"><p className="font-mono text-[7px] tracking-[.16em] text-red-300">WHY THE STOP MAKES SENSE</p><p className="mt-2 text-xs leading-5 text-zinc-400">{field(stopAnalysis?.reason, signal?.thesis?.invalidation)}</p></div></Card><Card title="Target Analysis" className="lg:col-span-2"><div className="grid gap-3 lg:grid-cols-3">{targets.map((target: any, i: number) => <div key={i} className="rounded-2xl border border-zinc-900 bg-black/10 p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Target className="h-3.5 w-3.5 text-emerald-300"/><span className="font-mono text-[8px] tracking-[.12em] text-zinc-500">TP{i + 1}</span></div><span className="font-mono text-[8px] text-emerald-300">{target?.riskReward != null ? `${fmt(target.riskReward)} R` : "—"}</span></div><p className="mt-3 text-lg font-semibold text-emerald-300">${fmt(target?.price)}</p><div className="mt-3 space-y-2 text-xs text-zinc-500"><p>Liquidity: <span className="text-zinc-300">{text(field(target?.liquidityClass, target?.liquidityType, target?.source))}</span></p><p>Timeframe: <span className="text-zinc-300">{text(target?.timeframe)}</span></p><p>{field(target?.reason, target?.explanation, target?.description)}</p></div></div>)}{!targets.length ? <p className="text-xs text-zinc-700">No published targets.</p> : null}</div></Card></div>;
}

function Quality({ signal }: { signal: Signal }) {
  const q = signal?.quality || {};
  const components = q?.components || {};
  const entries = Object.entries(components);
  return <Card title="Quality Breakdown"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{entries.length ? entries.map(([key, value]: any) => <div key={key} className="rounded-2xl border border-zinc-900 bg-black/10 px-4 py-3"><div className="flex items-center justify-between gap-3"><span className="font-mono text-[7px] tracking-[.12em] text-zinc-600">{text(key)}</span><span className="text-sm font-semibold text-zinc-200">{typeof value === "object" ? fmt(value?.score ?? value?.value) : fmt(value)}</span></div><p className="mt-2 text-[10px] leading-4 text-zinc-600">{typeof value === "object" ? field(value?.reason, value?.explanation) : "Engine quality component."}</p></div>) : <p className="text-xs text-zinc-700">Detailed scoring components were not supplied.</p>}</div><div className="mt-4 grid gap-2 sm:grid-cols-3"><Row label="OVERALL SCORE" value={`${fmt(q?.score, 0)} / 100`} accent/><Row label="GRADE" value={q?.grade || "—"} accent/><Row label="CONFIDENCE" value={text(q?.confidence)} accent/></div></Card>;
}

export default function SetupAnalysisPage({ setupId }: { setupId: string }) {
  const [signal, setSignal] = useState<Signal>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) { setLoading(false); setError("Sign in to view setup analysis."); return; }
    setLoading(true); setError("");
    try {
      const token = await user.getIdToken();
      const response = await kitsetupsAuthFetch("/api/signals", token);
      const body = await response.json();
      if (!response.ok || !body?.ok) throw new Error(body?.error || "Unable to load setup analysis");
      const data = body.data || {};
      const all = Array.isArray(data.signals) ? data.signals : Array.isArray(data.scanResults) ? data.scanResults : [];
      const decoded = decodeURIComponent(setupId);
      const found = all.find((item: Signal) => String(item?.signalId || item?.id || item?.symbol) === decoded);
      if (!found) throw new Error("This setup is no longer available in the live setup feed.");
      setSignal(found);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load setup analysis."); }
    finally { setLoading(false); }
  }, [setupId]);

  useEffect(() => { void auth.authStateReady().then(load); }, [load]);

  if (loading) return <StandaloneShell title="SETUP ANALYSIS"><div className="h-[70vh] animate-pulse rounded-3xl border border-zinc-900 bg-zinc-950/70" /></StandaloneShell>;
  if (error || !signal) return <StandaloneShell title="SETUP ANALYSIS"><div className="rounded-3xl border border-zinc-900 bg-zinc-950/70 p-8 text-center"><p className="text-sm text-zinc-300">{error || "Setup not found."}</p><Link href="/setups" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2 text-xs text-zinc-300">Back to setups</Link></div></StandaloneShell>;

  const direction = String(signal?.direction || "").toUpperCase();
  const targets = Array.isArray(signal?.targets) ? signal.targets.slice(0, 3) : [];
  const status = lifecycle(signal);

  return <StandaloneShell title="SETUP ANALYSIS">
    <div className="mb-6 flex items-center justify-between gap-3"><Link href="/setups" className="inline-flex items-center gap-2 text-xs text-zinc-500 transition hover:text-zinc-200"><ArrowLeft className="h-3.5 w-3.5"/> All setups</Link><button onClick={() => void load()} aria-label="Refresh analysis" className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-cyan-400/20 hover:text-cyan-300"><RefreshCw className="h-3.5 w-3.5"/></button></div>
    <header className="mb-5 rounded-3xl border border-zinc-800/90 bg-[#07090b] p-5 sm:p-7"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-[-.05em] text-zinc-100">{signal?.symbol}</h1><span className={`text-base font-semibold ${direction === "LONG" ? "text-emerald-300" : "text-red-300"}`}>{direction}</span><span className="rounded-full border border-zinc-800 px-2.5 py-1 font-mono text-[7px] tracking-[.13em] text-zinc-400">{text(signal?.setupType)}</span></div><p className="mt-2 text-xs text-zinc-600">Full engine intelligence for this published setup.</p></div><div className="flex flex-wrap gap-2"><span className="rounded-full border border-cyan-400/15 bg-cyan-400/[.04] px-3 py-2 font-mono text-[8px] text-cyan-200">{text(signal?.quality?.confidence)} CONFIDENCE</span><span className="rounded-full border border-zinc-800 px-3 py-2 font-mono text-[8px] text-zinc-300">GRADE {signal?.quality?.grade || "—"}</span><span className={`rounded-full border px-3 py-2 font-mono text-[8px] ${tone(status)}`}>{text(status)}</span></div></div><div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"><Row label="MARKET PRICE" value={`$${fmt(signal?.price)}`}/><Row label="ENTRY" value={`$${fmt(signal?.entry)}`} accent/><Row label="STOP" value={`$${fmt(signal?.stop)}`}/><Row label="TP1" value={`$${fmt(targets[0]?.price)}`} accent/><Row label="TP2" value={`$${fmt(targets[1]?.price)}`} accent/><Row label="TP3" value={`$${fmt(targets[2]?.price)}`} accent/></div></header>
    <div className="space-y-4"><Lifecycle signal={signal}/><TimeframeAnalysis signal={signal}/><StructureAnalysis signal={signal}/><LiquidityAnalysis signal={signal}/><EntryStopTargets signal={signal}/><Quality signal={signal}/><Card title="Setup Thesis"><div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/[.025] p-5"><p className="text-sm leading-7 text-zinc-300">{field(signal?.thesis?.structural, signal?.thesis?.liquidity, signal?.thesis?.entry, signal?.thesis?.summary)}</p></div></Card><Card title="Invalidation & Risks"><div className="flex gap-3 rounded-2xl border border-red-400/10 bg-red-400/[.025] p-5"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-300"/><div><p className="text-sm font-medium text-zinc-200">What makes the setup invalid?</p><p className="mt-2 text-xs leading-5 text-zinc-500">{field(signal?.thesis?.invalidation, signal?.analysis?.invalidation, signal?.reasons?.find((reason: string) => /invalid|risk|conflict/i.test(reason)))}</p></div></div></Card></div>
  </StandaloneShell>;
}
