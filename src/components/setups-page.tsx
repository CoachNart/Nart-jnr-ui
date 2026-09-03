"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, BarChart3, Clock3, Crosshair, RefreshCw, ShieldCheck, Target, TrendingDown, TrendingUp, Zap } from "lucide-react";
import StandaloneShell from "./standalone-shell";
import { auth } from "../lib/firebase";
import { kitsetupsAuthFetch } from "../lib/api";

type Signal = any;

function fmt(v: unknown, digits = 2) { const n = Number(v); return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: digits }) : "—"; }
function label(v: unknown) { return String(v || "—").replaceAll("_", " ").toUpperCase(); }
function status(s: Signal) { return String(s?.lifecycle?.status || s?.signalState || s?.status || "WAIT").toUpperCase(); }

export default function SetupsPageView() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [scanner, setScanner] = useState<Signal>(null);
  const [access, setAccess] = useState<Signal>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (silent = false) => {
    const user = auth.currentUser;
    if (!user) { setLoading(false); setError("Sign in to view live setups."); return; }
    if (silent) setRefreshing(true); else setLoading(true);
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
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    let mounted = true;
    const boot = async () => { await auth.authStateReady(); if (mounted) await load(); };
    void boot();
    const id = window.setInterval(() => { if (auth.currentUser) void load(true); }, 15000);
    return () => { mounted = false; window.clearInterval(id); };
  }, [load]);

  const ready = signals.filter((s) => ["READY", "ENTRY_HIT", "ACTIVE", "TP1_HIT", "TP2_HIT", "TP3_HIT"].includes(status(s)) && s.valid !== false);
  const visible = [...signals].sort((a,b) => Number(b?.quality?.score || 0) - Number(a?.quality?.score || 0));
  const hasAccess = Boolean(access?.hasAccess);

  return <StandaloneShell title="SETUPS">
    <section className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="font-mono text-[9px] tracking-[.22em] text-cyan-500">TRADE RADAR</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">Live setups</h1><p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-600">Signals ranked by the trading engine using live market conditions, structure, momentum and risk validation.</p></div>
      <button onClick={() => void load(true)} disabled={loading || refreshing} className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 font-mono text-[9px] font-medium tracking-[.12em] text-zinc-500 transition hover:border-cyan-400/20 hover:text-cyan-300 disabled:opacity-40"><RefreshCw className={refreshing ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"}/>REFRESH</button>
    </section>

    {error && <div className="mb-5 rounded-2xl border border-amber-500/15 bg-amber-500/[.035] p-4 text-xs text-amber-300">{error}</div>}

    <section className="mb-5 grid gap-3 sm:grid-cols-4">
      <Stat icon={<Crosshair/>} label="SCANNED" value={fmt(scanner?.scannedSymbols || signals.length, 0)} />
      <Stat icon={<Zap/>} label="READY" value={fmt(scanner?.readySignals ?? ready.length, 0)} />
      <Stat icon={<BarChart3/>} label="WAITING" value={fmt(scanner?.waitSignals ?? signals.filter(s => status(s) === "WAIT").length, 0)} />
      <Stat icon={<ShieldCheck/>} label="SCANNER" value={label(scanner?.status || "LIVE")} />
    </section>

    {!hasAccess && <div className="mb-5 rounded-2xl border border-cyan-400/10 bg-cyan-400/[.025] px-4 py-3 text-xs text-zinc-500"><span className="font-medium text-zinc-300">Market scanner is live.</span> Execution levels remain protected until your access is active.</div>}

    {loading && !signals.length ? <div className="grid gap-3 lg:grid-cols-2">{[1,2,3,4].map(i => <div key={i} className="h-48 animate-pulse rounded-2xl border border-zinc-900 bg-zinc-950/70"/>)}</div> : visible.length ? <div className="grid gap-3 lg:grid-cols-2">{visible.map((signal, i) => <SetupCard key={signal?.signalId || signal?.symbol || i} signal={signal} hasAccess={hasAccess}/>)}</div> : <div className="nart-card rounded-2xl border border-zinc-800/80 bg-zinc-950/75 px-5 py-14 text-center"><Crosshair className="mx-auto h-6 w-6 text-zinc-700"/><h3 className="mt-4 text-sm font-medium text-zinc-300">No evaluated setup right now</h3><p className="mx-auto mt-2 max-w-md text-xs leading-5 text-zinc-600">The scanner is connected to the live market feed and will show a setup when the engine confirms one.</p></div>}

    <div className="mt-4 flex items-center gap-2 font-mono text-[8px] text-zinc-700"><Clock3 className="h-3 w-3"/> {scanner?.updatedAt ? `SCANNER UPDATED ${new Date(scanner.updatedAt).toLocaleString()}` : "LIVE SCANNER"}</div>
  </StandaloneShell>;
}

function SetupCard({ signal, hasAccess }: { signal: Signal; hasAccess: boolean }) {
  const st = status(signal); const direction = String(signal?.direction || "").toUpperCase(); const score = Number(signal?.quality?.score || 0);
  const active = ["READY", "ENTRY_HIT", "ACTIVE", "TP1_HIT", "TP2_HIT", "TP3_HIT"].includes(st);
  const id = signal?.signalId || signal?.id;
  return <article className="group relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/75 p-5 transition hover:border-cyan-400/15">
    <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-black/30 text-cyan-400"><BarChart3 className="h-4 w-4"/></div><div><div className="flex items-center gap-2"><h2 className="text-base font-semibold text-zinc-100">{signal?.symbol || "—"}</h2><span className={`rounded-full border px-2 py-0.5 font-mono text-[7px] ${active ? "border-emerald-400/15 text-emerald-400" : "border-zinc-800 text-zinc-600"}`}>{label(st)}</span></div><p className="mt-1 font-mono text-[8px] text-zinc-700">{signal?.stage ? label(signal.stage) : "TRADING ENGINE"}</p></div></div><div className="text-right"><p className="font-mono text-[7px] tracking-[.15em] text-zinc-700">QUALITY</p><p className="mt-1 text-lg font-semibold text-cyan-300">{score}<span className="text-xs text-zinc-600">/100</span></p></div></div>
    <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4"><Mini label="PRICE" value={fmt(signal?.price)}/><Mini label="DIRECTION" value={direction || "WATCH"} trend={direction === "SHORT" ? "down" : direction === "LONG" ? "up" : undefined}/><Mini label="GRADE" value={label(signal?.quality?.grade || "WATCH")}/><Mini label="R:R" value={signal?.riskReward ? `${fmt(signal.riskReward, 2)}R` : "—"}/></div>
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-900 pt-3"><p className="line-clamp-2 text-[10px] leading-4 text-zinc-600">{signal?.reason || "Awaiting full setup confirmation from the trading engine."}</p>{id && <Link href={`/analysis?setup=${encodeURIComponent(id)}`} className="shrink-0 inline-flex items-center gap-1 font-mono text-[8px] text-cyan-400 transition hover:text-cyan-200">ANALYZE <ArrowUpRight className="h-3 w-3"/></Link>}</div>
    {!hasAccess && active && <div className="mt-3 rounded-xl border border-zinc-900 bg-black/20 px-3 py-2 font-mono text-[8px] text-zinc-700">EXECUTION LEVELS PROTECTED</div>}
  </article>;
}

function Stat({icon,label,value}:{icon:any;label:string;value:string}) { return <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-4"><div className="flex items-center justify-between"><span className="text-zinc-700">{icon}</span><span className="font-mono text-[7px] tracking-[.18em] text-zinc-700">{label}</span></div><p className="mt-3 text-lg font-semibold text-zinc-200">{value}</p></div>; }
function Mini({label,value,trend}:{label:string;value:string;trend?:string}) { return <div className="rounded-xl border border-zinc-900 bg-black/15 p-3"><p className="font-mono text-[7px] tracking-[.16em] text-zinc-700">{label}</p><p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-zinc-400">{trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-400"/>}{trend === "down" && <TrendingDown className="h-3 w-3 text-red-400"/>}{value}</p></div>; }
