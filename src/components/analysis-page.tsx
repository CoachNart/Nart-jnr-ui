"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, BarChart3, CheckCircle2, ChevronDown, Clock3, Layers3, LockKeyhole, RefreshCw, ShieldCheck, Target, TrendingDown, TrendingUp } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { kitsetupsAuthFetch } from "../lib/api";
import StandaloneShell from "./standalone-shell";

type Analysis = {
  symbol: string;
  timestamp?: string;
  market?: { price?: number | null; trend?: string | null; regime?: string | null; volatility?: string | null; change24hPercent?: number | null };
  technical?: { context?: any; structure?: any; momentum?: any; liquidity?: any };
  levels?: { support?: any[]; resistance?: any[]; entry?: number | null; entryZone?: any[]; invalidation?: number | null; stop?: number | null; targets?: any[] };
  setup?: { direction?: string | null; confidence?: number; score?: number; grade?: string | null; riskReward?: number | null; detection?: any };
  confluence?: Array<{ factor: string; signal?: string | null; weight?: number }>;
  risk?: { riskLevel?: string | null; invalidation?: number | null; warnings?: string[] };
  decision?: { status?: string; valid?: boolean; score?: number; reason?: string | null };
  evidence?: any;
  reasons?: string[];
  access?: any;
  subscribeRequired?: boolean;
  degraded?: boolean;
};

const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT"];

function fmt(value: unknown, digits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function label(value: unknown) {
  return String(value || "—").replaceAll("_", " ").toUpperCase();
}

function timeframeRows(analysis: Analysis) {
  const timeframes = analysis.technical?.context?.timeframes || {};
  return ["1w", "1d", "4h", "1h", "30m"].map((tf) => ({
    tf,
    ...(timeframes[tf] || {}),
    structure: analysis.technical?.structure?.[tf],
    momentum: analysis.technical?.momentum?.timeframes?.[tf],
  }));
}

export default function AnalysisPageView() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [token, setToken] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setToken(null);
        setLoading(false);
        setError("Sign in to load live market analysis.");
        return;
      }

      try {
        setToken(await user.getIdToken());
      } catch {
        setToken(null);
        setLoading(false);
        setError("Your session could not be verified.");
      }
    });
  }, []);

  async function load(selected = symbol) {
    if (!token) return;
    setLoading(true);
    setError("");

    try {
      const response = await kitsetupsAuthFetch(`/api/analysis/symbols/${selected}`, token);
      const body = await response.json();
      if (!response.ok || !body?.ok) throw new Error(body?.error || "Analysis request failed");
      setAnalysis(body.data?.analysis || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load analysis.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) load(symbol);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, symbol]);

  const rows = useMemo(() => timeframeRows(analysis || {}), [analysis]);
  const score = Number(analysis?.setup?.score || 0);
  const hasPremium = Boolean(analysis?.access?.hasAccess);
  const direction = analysis?.setup?.direction;

  return (
    <StandaloneShell title="MARKET ANALYSIS">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[9px] tracking-[.2em] text-cyan-400">ENGINE INTELLIGENCE</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">Why this market matters</h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-600">Analysis is produced by the same trading engine that evaluates KitSetups. The frontend only presents the evidence.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="appearance-none rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 pr-9 text-xs font-medium text-zinc-200 outline-none focus:border-cyan-400/30">
              {SYMBOLS.map((item) => <option key={item}>{item}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-3 h-3.5 w-3.5 text-zinc-600" />
          </div>
          <button onClick={() => load()} disabled={loading || !token} className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-xs text-zinc-400 transition hover:border-cyan-400/20 hover:text-cyan-300 disabled:opacity-40">
            <RefreshCw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="mb-5 rounded-2xl border border-amber-500/15 bg-amber-500/[.04] p-4 text-xs text-amber-300">{error}</div>}

      {loading && !analysis ? (
        <div className="grid gap-3 md:grid-cols-3">
          {[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl border border-zinc-900 bg-zinc-950/70" />)}
        </div>
      ) : analysis ? (
        <>
          <section className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr]">
            <Card>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[9px] tracking-[.18em] text-zinc-600">CURRENT MARKET</p>
                  <div className="mt-3 flex items-end gap-3"><span className="text-3xl font-semibold text-zinc-100">{fmt(analysis.market?.price)}</span><span className="pb-1 font-mono text-[10px] text-zinc-600">{analysis.symbol}</span></div>
                  <div className="mt-3 flex flex-wrap gap-2"><Badge text={label(analysis.market?.trend)} /><Badge text={label(analysis.market?.regime)} /><Badge text={label(analysis.market?.volatility)} /></div>
                </div>
                <Activity className="h-5 w-5 text-cyan-400" />
              </div>
            </Card>
            <MetricCard icon={<Target />} title="ENGINE SCORE" value={`${score}/100`} sub={analysis.setup?.grade || "WATCH"} />
            <MetricCard icon={direction === "SHORT" ? <TrendingDown /> : <TrendingUp />} title="DECISION" value={label(analysis.decision?.status)} sub={analysis.decision?.reason || "Awaiting confirmation"} />
          </section>

          {!hasPremium && analysis.subscribeRequired && (
            <section className="mt-5 flex items-center gap-4 rounded-2xl border border-cyan-400/10 bg-cyan-400/[.025] p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[.04]"><LockKeyhole className="h-4 w-4 text-cyan-400" /></div>
              <div><p className="text-sm font-medium text-zinc-200">Execution levels are protected</p><p className="mt-1 text-xs text-zinc-600">Market context remains visible. Entry, invalidation and targets unlock with your access.</p></div>
            </section>
          )}

          <section className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_.8fr]">
            <div className="nart-card rounded-2xl border border-zinc-800/80 bg-zinc-950/75 p-5">
              <div className="mb-4 flex items-center justify-between"><div><p className="font-mono text-[9px] tracking-[.18em] text-zinc-600">MULTI-TIMEFRAME EVIDENCE</p><p className="mt-1 text-sm font-medium text-zinc-200">Market structure and momentum</p></div><Layers3 className="h-4 w-4 text-zinc-600" /></div>
              <div className="overflow-x-auto"><table className="w-full min-w-[540px] text-left"><thead><tr className="border-b border-zinc-900 text-[9px] font-mono tracking-widest text-zinc-700"><th className="pb-3">TF</th><th className="pb-3">BIAS</th><th className="pb-3">STRUCTURE</th><th className="pb-3">MOMENTUM</th><th className="pb-3">PRESSURE</th></tr></thead><tbody>{rows.map((row) => <tr key={row.tf} className="border-b border-zinc-900/70 text-xs"><td className="py-3 font-mono text-zinc-300">{row.tf}</td><td className="py-3 text-zinc-400">{label(row.bias || row.structure?.direction)}</td><td className="py-3 text-zinc-500">{label(row.structure?.breaks?.latest?.kind || row.structure?.pattern || row.structure?.direction)}</td><td className="py-3 text-zinc-500">{label(row.momentum?.direction || row.momentum?.bias)}</td><td className="py-3 text-zinc-500">{fmt(row.pressure, 3)}</td></tr>)}</tbody></table></div>
            </div>

            <div className="space-y-5">
              <div className="nart-card rounded-2xl border border-zinc-800/80 bg-zinc-950/75 p-5"><div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-cyan-400"/><p className="font-mono text-[9px] tracking-[.18em] text-zinc-600">CONFLUENCE</p></div><div className="mt-4 space-y-3">{(analysis.confluence || []).map((item, index) => <div key={`${item.factor}-${index}`} className="flex items-center justify-between gap-3"><span className="text-xs text-zinc-400">{item.factor}</span><span className="font-mono text-[9px] text-zinc-600">{item.weight ?? "—"}</span></div>)}{!analysis.confluence?.length && <p className="text-xs text-zinc-600">No scored confluence components returned.</p>}</div></div>
              <div className="nart-card rounded-2xl border border-zinc-800/80 bg-zinc-950/75 p-5"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-400"/><p className="font-mono text-[9px] tracking-[.18em] text-zinc-600">RISK CHECK</p></div><p className="mt-3 text-lg font-semibold text-zinc-200">{label(analysis.risk?.riskLevel)}</p><div className="mt-3 space-y-2">{(analysis.risk?.warnings || []).map((warning, index) => <p key={index} className="flex gap-2 text-xs leading-5 text-zinc-500"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />{warning}</p>)}</div></div>
            </div>
          </section>

          <section className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="nart-card rounded-2xl border border-zinc-800/80 bg-zinc-950/75 p-5"><div className="flex items-center gap-2"><Target className="h-4 w-4 text-cyan-400"/><p className="font-mono text-[9px] tracking-[.18em] text-zinc-600">TRADE LEVELS</p></div>{hasPremium ? <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><Level label="Entry" value={analysis.levels?.entry} /><Level label="Stop" value={analysis.levels?.stop} /><Level label="TP1" value={analysis.levels?.targets?.[0]?.price} /><Level label="R:R" value={analysis.setup?.riskReward ? `${fmt(analysis.setup.riskReward, 2)}R` : null} /></div> : <div className="mt-4 rounded-xl border border-zinc-900 bg-black/20 p-4 text-xs text-zinc-600">Execution levels are hidden until access is active.</div>}</div>
            <div className="nart-card rounded-2xl border border-zinc-800/80 bg-zinc-950/75 p-5"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-400"/><p className="font-mono text-[9px] tracking-[.18em] text-zinc-600">WHY THE ENGINE DECIDED THIS</p></div><div className="mt-4 space-y-2">{(analysis.reasons || []).slice(0, 8).map((reason, index) => <div key={index} className="flex gap-2 text-xs leading-5 text-zinc-400"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-cyan-400" />{reason}</div>)}{!analysis.reasons?.length && <p className="text-xs text-zinc-600">{analysis.decision?.reason || "No decision explanation returned."}</p>}</div></div>
          </section>

          <div className="mt-4 flex items-center gap-2 font-mono text-[9px] text-zinc-700"><Clock3 className="h-3 w-3" /> LAST ENGINE UPDATE {analysis.timestamp ? new Date(analysis.timestamp).toLocaleString() : "—"}{analysis.degraded ? " · DEGRADED" : ""}</div>
        </>
      ) : null}
    </StandaloneShell>
  );
}

function Card({ children }: { children: React.ReactNode }) { return <div className="nart-card rounded-2xl border border-zinc-800/80 bg-zinc-950/75 p-5">{children}</div>; }
function Badge({ text }: { text: string }) { return <span className="rounded-full border border-zinc-800 bg-black/20 px-2.5 py-1 font-mono text-[8px] tracking-wider text-zinc-500">{text}</span>; }
function MetricCard({ icon, title, value, sub }: { icon: React.ReactNode; title: string; value: string; sub: string }) { return <Card><div className="flex items-center justify-between"><p className="font-mono text-[9px] tracking-[.18em] text-zinc-600">{title}</p><span className="text-cyan-400">{icon}</span></div><p className="mt-4 text-xl font-semibold text-zinc-100">{value}</p><p className="mt-1 line-clamp-2 text-[10px] text-zinc-600">{sub}</p></Card>; }
function Level({ label: name, value }: { label: string; value?: unknown }) { return <div className="rounded-xl border border-zinc-900 bg-black/20 p-3"><p className="font-mono text-[8px] text-zinc-700">{name}</p><p className="mt-2 text-sm font-semibold text-zinc-300">{value == null ? "—" : typeof value === "number" ? fmt(value) : String(value)}</p></div>; }
