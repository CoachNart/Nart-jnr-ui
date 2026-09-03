"use client";

import { useEffect, useMemo, useState } from "react";
import StandaloneShell from "../../components/standalone-shell";
import { auth } from "../../lib/firebase";
import { kitsetupsAuthFetch } from "../../lib/api";

type SignalOutcome = "TP_HIT" | "STOP_LOSS" | "MISSED_ENTRY" | "EXPIRED" | "ACTIVE" | "ENTRY_HIT" | "CLOSED" | "READY" | "WAIT";
const labels: Record<SignalOutcome, string> = {
  TP_HIT: "TP HIT", STOP_LOSS: "STOP LOSS", MISSED_ENTRY: "MISSED ENTRY", EXPIRED: "EXPIRED",
  ACTIVE: "ACTIVE", ENTRY_HIT: "ENTRY HIT", CLOSED: "CLOSED", READY: "READY", WAIT: "WAIT",
};
const tabs: Array<"ALL" | SignalOutcome> = ["ALL", "TP_HIT", "STOP_LOSS", "MISSED_ENTRY", "EXPIRED"];

function outcomeOf(signal: any): SignalOutcome {
  const status = String(signal?.lifecycle?.status || signal?.signalState || signal?.status || "WAIT").toUpperCase();
  if (["TP3_HIT", "TP2_HIT", "TP1_HIT"].includes(status)) return "TP_HIT";
  if (status === "STOP_LOSS") return "STOP_LOSS";
  if (status === "MISSED") return "MISSED_ENTRY";
  if (status === "EXPIRED") return "EXPIRED";
  return status as SignalOutcome;
}

function dateOf(signal: any) {
  return signal?.publishedAt || signal?.closedAt || signal?.updatedAt || signal?.generatedAt || null;
}

export default function HistoryPage() {
  const [filter, setFilter] = useState<(typeof tabs)[number]>("ALL");
  const [query, setQuery] = useState("");
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        await auth.authStateReady();
        const user = auth.currentUser;
        if (!user) throw new Error("Sign in to view signal history.");
        const token = await user.getIdToken();
        const response = await kitsetupsAuthFetch("/api/signals/history", token);
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body?.ok) throw new Error(body?.error || `History service returned ${response.status}`);
        if (active) setSignals(Array.isArray(body?.data?.signals) ? body.data.signals : []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load signal history.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const shown = useMemo(() => signals
    .filter((r) => {
      const outcome = outcomeOf(r);
      const pair = String(r?.symbol || r?.pair || "");
      return (filter === "ALL" || outcome === filter) && pair.toLowerCase().includes(query.toLowerCase());
    })
    .sort((a, b) => Date.parse(dateOf(b) || "") - Date.parse(dateOf(a) || "")), [signals, filter, query]);

  const total = signals.length;
  const wins = signals.filter(r => outcomeOf(r) === "TP_HIT").length;
  const losses = signals.filter(r => outcomeOf(r) === "STOP_LOSS").length;
  const missed = signals.filter(r => outcomeOf(r) === "MISSED_ENTRY").length;
  const winRate = total ? `${((wins / total) * 100).toFixed(1)}%` : "—";

  return <StandaloneShell title="SIGNAL HISTORY">
    <section className="mb-6 max-w-2xl">
      <p className="font-mono text-[9px] tracking-[.22em] text-cyan-500">PERFORMANCE JOURNAL</p>
      <h1 className="mt-2 text-[2rem] font-semibold tracking-[-.04em] text-white sm:text-3xl">Track every signal.</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">Review signals published by the live engine, their trade levels and recorded outcomes as the market moves.</p>
    </section>

    {error && <div className="mb-5 rounded-xl border border-amber-500/15 bg-amber-500/[.035] p-3 text-xs text-amber-300">{error}</div>}

    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <Kpi t="TOTAL" v={total}/><Kpi t="TP HIT" v={wins}/><Kpi t="STOP LOSS" v={losses}/><Kpi t="MISSED" v={missed}/><Kpi t="WIN RATE" v={winRate}/>
    </div>

    <div className="nart-card mt-5 overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/70">
      <div className="flex flex-col gap-3 border-b border-zinc-900 p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-1 overflow-x-auto pb-0.5">{tabs.map(t => <button key={t} onClick={() => setFilter(t)} className={`whitespace-nowrap rounded-lg px-3 py-2 font-mono text-[9px] tracking-wider transition ${filter === t ? "bg-cyan-400/10 text-cyan-300" : "text-zinc-600 hover:bg-white/[.03] hover:text-zinc-300"}`}>{t === "ALL" ? "ALL" : labels[t]}</button>)}</div>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search pair" className="w-full rounded-lg border border-zinc-800 bg-black/60 px-3 py-2 text-xs text-white outline-none transition placeholder:text-zinc-700 focus:border-cyan-500/40 md:w-48"/>
      </div>

      {loading ? <div className="px-5 py-20 text-center text-xs text-zinc-600">Loading signal history…</div> : shown.length === 0 ? <div className="px-5 py-20 text-center sm:px-6"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-zinc-800 bg-black/40 text-zinc-700">—</div><h2 className="mt-4 text-sm font-medium text-zinc-300">No recorded signals yet</h2><p className="mx-auto mt-2 max-w-md text-xs leading-5 text-zinc-600">Signals will appear here as the engine publishes and records them. No demo performance numbers are shown.</p></div> : <div className="divide-y divide-zinc-900">{shown.map((r, i) => { const outcome = outcomeOf(r); const targets = Array.isArray(r?.targets) ? r.targets : []; return <div key={r?.signalId || r?.id || `${r?.symbol}-${i}`} className="grid gap-4 p-4 transition hover:bg-white/[.015] md:grid-cols-[1.4fr_repeat(3,1fr)_auto] md:items-center"><div><p className="font-semibold text-zinc-200">{r?.symbol || "—"}</p><p className="mt-1 font-mono text-[9px] text-zinc-600">{String(r?.direction || "WATCH")} · {r?.quality?.grade || "—"} · {r?.quality?.score ?? "—"}</p></div><M l="ENTRY" v={fmt(r?.entry)}/><M l="STOP" v={fmt(r?.stop)}/><M l="TARGET" v={fmt(targets[0]?.price)}/><div className="rounded-full border border-zinc-800 px-3 py-1 text-center font-mono text-[9px] text-zinc-400">{labels[outcome] || outcome}</div></div>; })}</div>}
    </div>
  </StandaloneShell>;
}

function Kpi({ t, v }: { t: string; v: string | number }) { return <div className="nart-card rounded-2xl border border-zinc-800/80 bg-zinc-950/75 p-4"><p className="font-mono text-[9px] tracking-widest text-zinc-600">{t}</p><p className="mt-2 font-mono text-xl font-semibold text-zinc-100">{v}</p></div>; }
function M({ l, v }: { l: string; v: string }) { return <div><p className="font-mono text-[9px] text-zinc-600">{l}</p><p className="mt-1 font-mono text-xs text-zinc-300">{v}</p></div>; }
function fmt(v: unknown) { return v == null || v === "" ? "—" : String(v); }
