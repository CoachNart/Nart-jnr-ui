"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Clock3, Layers3, LockKeyhole, RefreshCw, ShieldCheck, Target, TrendingDown, TrendingUp } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { kitsetupsAuthFetch } from "../lib/api";
import StandaloneShell from "./standalone-shell";

type Analysis = any;
const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT"];

function fmt(value: unknown, digits = 2) { const n = Number(value); return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: digits }) : "—"; }
function label(value: unknown) { return String(value || "—").replaceAll("_", " ").toUpperCase(); }

export default function AnalysisPageView() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [token, setToken] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) { setToken(null); setLoading(false); setError("Sign in to view live market analysis."); return; }
    try { setToken(await user.getIdToken()); } catch { setLoading(false); setError("Your session could not be verified."); }
  }), []);

  async function load(selected = symbol) {
    if (!token) return;
    setLoading(true); setError("");
    try {
      const response = await kitsetupsAuthFetch(`/api/analysis/symbols/${selected}`, token);
      const body = await response.json();
      if (!response.ok || !body?.ok) throw new Error(body?.error || "Analysis request failed");
      setAnalysis(body.data?.analysis || null);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load analysis."); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (token) load(symbol); }, [token, symbol]);

  const context = analysis?.technical?.context;
  const timeframes = context?.timeframes || {};
  const structure = analysis?.technical?.structure || {};
  const momentum = analysis?.technical?.momentum?.timeframes || {};
  const score = Number(analysis?.setup?.score || 0);
  const premium = Boolean(analysis?.access?.hasAccess);
  const direction = analysis?.setup?.direction;

  return <StandaloneShell title="MARKET ANALYSIS">
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="font-mono text-[9px] tracking-[.2em] text-cyan-400">MARKET READ</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">Market analysis</h1><p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-600">Technical conditions for the selected market, including price structure, momentum, volatility and setup strength.</p></div>
      <div className="flex gap-2"><div className="relative"><select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="appearance-none rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 pr-9 text-xs text-zinc-200 outline-none">{SYMBOLS.map(s => <option key={s}>{s}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 h-3.5 w-3.5 text-zinc-600" /></div><button onClick={() => load()} disabled={loading || !token} className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-xs text-zinc-400 hover:text-cyan-300 disabled:opacity-40"><RefreshCw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />Refresh</button></div>
    </div>

    {error && <div className="mb-5 rounded-2xl border border-amber-500/15 bg-amber-500/[.04] p-4 text-xs text-amber-300">{error}</div>}
    {loading && !analysis && <div className="grid gap-3 md:grid-cols-3">{[1,2,3].map(n => <div key={n} className="h-28 animate-pulse rounded-2xl border border-zinc-900 bg-zinc-950/70" />)}</div>}

    {analysis && <>
      <section className="grid gap-3 md:grid-cols-3"><Card><p className="kicker">MARKET OVERVIEW</p><div className="mt-3 flex items-end gap-3"><span className="text-3xl font-semibold text-zinc-100">{fmt(analysis.market?.price)}</span><span className="pb-1 font-mono text-[10px] text-zinc-600">{analysis.symbol}</span></div><div className="mt-3 flex flex-wrap gap-2"><Badge text={label(analysis.market?.trend)} /><Badge text={label(analysis.market?.regime)} /><Badge text={label(analysis.market?.volatility)} /></div></Card><Metric title="SETUP SCORE" value={`${score}/100`} sub={analysis.setup?.grade || "No grade"} icon={<Target />} /><Metric title="MARKET BIAS" value={label(analysis.decision?.status)} sub={analysis.decision?.reason || "No directional confirmation"} icon={direction === "SHORT" ? <TrendingDown /> : <TrendingUp />} /></section>

      {!premium && analysis.subscribeRequired && <div className="mt-5 flex items-center gap-3 rounded-2xl border border-cyan-400/10 bg-cyan-400/[.025] p-4"><LockKeyhole className="h-4 w-4 shrink-0 text-cyan-400" /><div><p className="text-sm font-medium text-zinc-200">Trade levels are locked</p><p className="mt-1 text-xs text-zinc-600">The market read remains available. Entry, stop and target levels require active access.</p></div></div>}

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_.8fr]"><Card><div className="mb-4 flex items-center justify-between"><div><p className="kicker">TIMEFRAME BREAKDOWN</p><p className="mt-1 text-sm text-zinc-200">Structure and momentum by timeframe</p></div><Layers3 className="h-4 w-4 text-zinc-600" /></div><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left"><thead><tr className="border-b border-zinc-900 font-mono text-[9px] text-zinc-700"><th className="pb-3">TF</th><th className="pb-3">BIAS</th><th className="pb-3">STRUCTURE</th><th className="pb-3">MOMENTUM</th><th className="pb-3">PRESSURE</th></tr></thead><tbody>{["1w","1d","4h","1h","30m"].map(tf => <tr key={tf} className="border-b border-zinc-900/70 text-xs"><td className="py-3 font-mono text-zinc-300">{tf}</td><td className="py-3 text-zinc-400">{label(timeframes[tf]?.bias || structure[tf]?.direction)}</td><td className="py-3 text-zinc-500">{label(structure[tf]?.breaks?.latest?.kind || structure[tf]?.pattern || structure[tf]?.direction)}</td><td className="py-3 text-zinc-500">{label(momentum[tf]?.direction || momentum[tf]?.bias)}</td><td className="py-3 text-zinc-500">{fmt(timeframes[tf]?.pressure, 3)}</td></tr>)}</tbody></table></div></Card><div className="space-y-5"><Card><p className="kicker">CONFLUENCE</p><p className="mt-1 text-xs text-zinc-600">Factors contributing to the current setup score.</p><div className="mt-4 space-y-3">{Object.entries(analysis?.evidence?.quality?.components || analysis?.setup?.components || {}).map(([key,value]) => <div key={key} className="flex justify-between text-xs"><span className="text-zinc-400">{label(key)}</span><span className="font-mono text-zinc-600">{String(value)}</span></div>)}{!Object.keys(analysis?.evidence?.quality?.components || analysis?.setup?.components || {}).length && <p className="text-xs text-zinc-600">No component breakdown was returned.</p>}</div></Card><Card><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-400"/><p className="kicker">RISK CONDITIONS</p></div><p className="mt-3 text-lg font-semibold text-zinc-200">{label(analysis.risk?.riskLevel)}</p>{(analysis.risk?.warnings || []).map((w:string,i:number)=><p key={i} className="mt-2 flex gap-2 text-xs text-zinc-500"><AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />{w}</p>)}{!analysis.risk?.warnings?.length && <p className="mt-2 text-xs text-zinc-600">No additional risk warnings were returned.</p>}</Card></div></section>

      <section className="mt-5 grid gap-5 md:grid-cols-2"><Card><div className="flex items-center gap-2"><Target className="h-4 w-4 text-cyan-400"/><p className="kicker">TRADE LEVELS</p></div>{premium ? <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><Level name="Entry" value={analysis.levels?.entry}/><Level name="Stop" value={analysis.levels?.stop}/><Level name="TP1" value={analysis.levels?.targets?.[0]?.price}/><Level name="R:R" value={analysis.setup?.riskReward ? `${fmt(analysis.setup.riskReward,2)}R` : null}/></div> : <p className="mt-4 rounded-xl border border-zinc-900 p-4 text-xs text-zinc-600">Entry, stop and target levels are hidden until access is active.</p>}</Card><Card><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-400"/><p className="kicker">ANALYSIS SUMMARY</p></div><div className="mt-4 space-y-2">{(analysis.reasons || []).slice(0,8).map((r:string,i:number)=><p key={i} className="flex gap-2 text-xs leading-5 text-zinc-400"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-cyan-400"/>{r}</p>)}{!analysis.reasons?.length && <p className="text-xs text-zinc-600">{analysis.decision?.reason || "No analysis summary was returned."}</p>}</div></Card></section>
      <div className="mt-4 flex items-center gap-2 font-mono text-[9px] text-zinc-700"><Clock3 className="h-3 w-3"/> LAST UPDATED {analysis.timestamp ? new Date(analysis.timestamp).toLocaleString() : "—"}</div>
    </>}
  </StandaloneShell>;
}

function Card({children}:{children:ReactNode}) { return <div className="nart-card rounded-2xl border border-zinc-800/80 bg-zinc-950/75 p-5">{children}</div>; }
function Metric({icon,title,value,sub}:{icon:ReactNode;title:string;value:string;sub:string}) { return <Card><div className="flex justify-between"><p className="kicker">{title}</p><span className="text-cyan-400">{icon}</span></div><p className="mt-4 text-xl font-semibold text-zinc-100">{value}</p><p className="mt-1 line-clamp-2 text-[10px] text-zinc-600">{sub}</p></Card>; }
function Badge({text}:{text:string}) { return <span className="rounded-full border border-zinc-800 px-2.5 py-1 font-mono text-[8px] text-zinc-500">{text}</span>; }
function Level({name,value}:{name:string;value:unknown}) { return <div className="rounded-xl border border-zinc-900 p-3"><p className="font-mono text-[8px] text-zinc-700">{name}</p><p className="mt-2 text-sm font-semibold text-zinc-300">{value == null ? "—" : typeof value === "number" ? fmt(value) : String(value)}</p></div>; }
