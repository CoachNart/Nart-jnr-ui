"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, RefreshCw, ShieldAlert } from "lucide-react";
import StandaloneShell from "./standalone-shell";
import { auth } from "../lib/firebase";
import { kitsetupsAuthFetch } from "../lib/api";

type AnyData = Record<string, any>;

const TIMEFRAMES = ["1w", "1d", "4h", "1h", "30m"];

function fmt(value: any, digits = 2) {
  const number = Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString(undefined, { maximumFractionDigits: digits })
    : "—";
}

function text(value: any) {
  return String(value ?? "—").replaceAll("_", " ").toUpperCase();
}

function first(...values: any[]) {
  return values.find((value) => value !== undefined && value !== null && value !== "") ?? "—";
}

function Box({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-zinc-900 bg-[#080a0c] p-5 sm:p-6 ${className}`}>
      <h2 className="mb-4 text-sm font-semibold text-zinc-100">{title}</h2>
      {children}
    </section>
  );
}

function Metric({ label, value, tone = "neutral" }: { label: string; value: any; tone?: "neutral" | "green" | "red" | "blue" }) {
  const toneClass =
    tone === "green"
      ? "text-emerald-300"
      : tone === "red"
        ? "text-red-300"
        : tone === "blue"
          ? "text-blue-300"
          : "text-zinc-100";

  return (
    <div className="rounded-2xl border border-zinc-900 bg-black/20 p-3.5">
      <p className="font-mono text-[7px] tracking-[.16em] text-zinc-600">{label}</p>
      <p className={`mt-2 text-sm font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function DataList({ items }: { items: any }) {
  const values = Array.isArray(items) ? items : items ? [items] : [];

  if (!values.length) {
    return <p className="text-xs text-zinc-700">No engine data supplied.</p>;
  }

  return (
    <div className="space-y-2">
      {values.slice(0, 12).map((item: any, index: number) => (
        <div key={index} className="rounded-xl border border-zinc-900 bg-black/10 px-3 py-3 text-xs text-zinc-400">
          {typeof item === "string" ? (
            item
          ) : (
            <>
              <span className="font-medium text-zinc-200">{fmt(item?.price ?? item?.level ?? item?.value)}</span>
              {item?.timeframe ? <span className="ml-2 font-mono text-[8px] text-zinc-600">{text(item.timeframe)}</span> : null}
              {item?.type ? <span className="ml-2 font-mono text-[8px] text-zinc-600">{text(item.type)}</span> : null}
              {item?.reason ? <p className="mt-1.5 leading-5 text-zinc-500">{item.reason}</p> : null}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function Lifecycle({ setup, analysis }: { setup: AnyData; analysis: AnyData }) {
  const lifecycle = setup?.lifecycle || analysis?.lifecycle || {};
  const status = text(lifecycle?.status || setup?.status || analysis?.decision?.status || "WAIT");
  const history = Array.isArray(lifecycle?.history)
    ? lifecycle.history
    : Array.isArray(lifecycle?.events)
      ? lifecycle.events
      : [];

  return (
    <Box title="Lifecycle">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-cyan-400/15 bg-cyan-400/[.04] px-3 py-2 font-mono text-[8px] tracking-[.1em] text-cyan-200">
          {status}
        </span>
        {lifecycle?.outcome ? (
          <span className="font-mono text-[8px] tracking-[.1em] text-zinc-600">OUTCOME · {text(lifecycle.outcome)}</span>
        ) : null}
      </div>

      {history.length ? (
        <div className="mt-5 flex items-center gap-1 overflow-x-auto pb-1">
          {history.map((event: any, index: number) => (
            <div key={index} className="flex shrink-0 items-center gap-1">
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[.04] px-2.5 py-1.5 font-mono text-[7px] tracking-[.08em] text-emerald-300">
                {text(event?.status || event?.state || event)}
              </span>
              {index < history.length - 1 ? <span className="text-zinc-800">→</span> : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-xs text-zinc-600">The engine has not supplied a lifecycle event history; the current canonical state is shown above.</p>
      )}
    </Box>
  );
}

function Context({ analysis }: { analysis: AnyData }) {
  const context = analysis?.evidence?.context || analysis?.technical?.context || analysis?.context || {};
  const structures = analysis?.evidence?.structures || analysis?.technical?.structure || analysis?.structures || {};
  const momentum = analysis?.evidence?.momentum || analysis?.technical?.momentum || analysis?.momentum || {};

  return (
    <Box title="Market Context">
      <div className="space-y-2">
        {TIMEFRAMES.map((timeframe) => {
          const current = context?.timeframes?.[timeframe] || context?.[timeframe] || {};
          const structure = structures?.[timeframe] || {};
          const currentMomentum = momentum?.[timeframe] || momentum?.timeframes?.[timeframe] || {};
          const role = timeframe === "1w" ? "MACRO" : timeframe === "1d" ? "PRIMARY" : timeframe === "4h" ? "INTERMEDIATE" : timeframe === "1h" ? "TRADE" : "EXECUTION";

          return (
            <div key={timeframe} className="rounded-2xl border border-zinc-900 bg-black/10 p-4">
              <div className="flex justify-between">
                <span className="font-mono text-[9px] text-zinc-200">
                  {timeframe.toUpperCase()} <span className="ml-2 text-[7px] text-zinc-600">{role}</span>
                </span>
                <span className="font-mono text-[7px] text-zinc-600">{text(first(current?.regime, current?.marketRegime))}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Metric label="TREND" value={text(first(current?.trend, structure?.direction))} />
                <Metric label="STRUCTURE" value={text(first(structure?.structure, structure?.breaks?.latest?.kind))} />
                <Metric label="MOMENTUM" value={text(first(currentMomentum?.direction, currentMomentum?.bias))} />
              </div>
              <p className="mt-3 text-xs leading-5 text-zinc-500">
                {first(current?.context, current?.summary, current?.reason, structure?.summary, currentMomentum?.summary)}
              </p>
            </div>
          );
        })}
      </div>
    </Box>
  );
}

function Structure({ analysis }: { analysis: AnyData }) {
  const structures = analysis?.evidence?.structures || analysis?.technical?.structure || analysis?.structures || {};

  return (
    <Box title="Structure Analysis">
      <div className="space-y-3">
        {TIMEFRAMES.map((timeframe) => {
          const current = structures?.[timeframe] || {};
          const latestBreak = current?.breaks?.latest || {};

          return (
            <div key={timeframe} className="rounded-2xl border border-zinc-900 bg-black/10 p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-zinc-200">{timeframe.toUpperCase()}</span>
                <span className="font-mono text-[8px] text-cyan-300">{text(first(current?.structure, current?.direction, current?.trend))}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Metric label="BOS" value={text(first(current?.bos, latestBreak?.kind === "BOS" ? latestBreak.kind : undefined))} />
                <Metric label="CHoCH" value={text(first(current?.choch, latestBreak?.kind === "CHoCH" ? latestBreak.kind : undefined))} />
                <Metric label="PROTECTED HIGH" value={fmt(first(current?.protectedHigh?.price, current?.protectedHigh?.level))} />
                <Metric label="PROTECTED LOW" value={fmt(first(current?.protectedLow?.price, current?.protectedLow?.level))} />
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                Structural break: {fmt(first(latestBreak?.level, latestBreak?.price))} · {text(first(latestBreak?.kind, latestBreak?.type))}
              </p>
            </div>
          );
        })}
      </div>
    </Box>
  );
}

function Liquidity({ analysis }: { analysis: AnyData }) {
  const liquidity = analysis?.evidence?.liquidity || analysis?.technical?.liquidity || analysis?.liquidity || {};
  const groups = [
    ["BUY-SIDE", first(liquidity?.buySide, liquidity?.buySideLiquidity)],
    ["SELL-SIDE", first(liquidity?.sellSide, liquidity?.sellSideLiquidity)],
    ["EQH", first(liquidity?.eqh, liquidity?.equalHighs)],
    ["EQL", first(liquidity?.eql, liquidity?.equalLows)],
    ["SWEPT", first(liquidity?.swept, liquidity?.sweptLiquidity)],
    ["UNSWEPT", first(liquidity?.unswept, liquidity?.unsweptLiquidity)],
  ];

  return (
    <Box title="Liquidity Analysis">
      <div className="grid gap-3 sm:grid-cols-2">
        {groups.map(([label, items]) => (
          <div key={String(label)} className="rounded-2xl border border-zinc-900 bg-black/10 p-4">
            <p className="font-mono text-[7px] tracking-[.16em] text-zinc-600">{label}</p>
            <div className="mt-3"><DataList items={items} /></div>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Metric label="NEAREST" value={fmt(first(liquidity?.nearestMeaningful?.price, liquidity?.nearest?.price, liquidity?.nearestMeaningful))} />
        <Metric label="NEXT" value={fmt(first(liquidity?.nextMeaningful?.price, liquidity?.next?.price, liquidity?.nextMeaningful))} />
        <Metric label="EXTERNAL" value={fmt(first(liquidity?.external?.price, liquidity?.externalLiquidity?.price, liquidity?.external))} />
      </div>
      <p className="mt-4 text-xs leading-5 text-zinc-500">
        {first(liquidity?.summary, liquidity?.reason, analysis?.reasons?.join?.(" "))}
      </p>
    </Box>
  );
}

function EntryStopTargets({ analysis, setup }: { analysis: AnyData; setup: AnyData }) {
  const entry = analysis?.evidence?.entry || analysis?.levels || {};
  const stop = analysis?.evidence?.stop || {};
  const targets = Array.isArray(setup?.targets)
    ? setup.targets
    : Array.isArray(analysis?.levels?.targets)
      ? analysis.levels.targets
      : Array.isArray(analysis?.evidence?.targets)
        ? analysis.evidence.targets
        : [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Box title="Entry Analysis">
        <div className="grid grid-cols-2 gap-2">
          <Metric label="MODEL" value={text(first(entry?.model, setup?.setupType))} />
          <Metric label="TIMEFRAME" value={text(first(entry?.timeframe, setup?.timeframe, analysis?.timeframe))} />
          <Metric label="ENTRY" value={`$${fmt(first(entry?.price, setup?.entry, analysis?.levels?.entry))}`} tone="blue" />
          <Metric label="BREAK LEVEL" value={`$${fmt(first(entry?.breakLevel, entry?.level))}`} />
        </div>
        <p className="mt-3 rounded-2xl border border-zinc-900 bg-black/10 p-4 text-xs leading-5 text-zinc-500">
          {first(entry?.confirmation, entry?.reason, setup?.thesis?.entry)}
        </p>
      </Box>

      <Box title="Stop Analysis">
        <div className="grid grid-cols-2 gap-2">
          <Metric label="STOP" value={`$${fmt(first(stop?.stop, setup?.stop, analysis?.levels?.stop))}`} tone="red" />
          <Metric label="STRUCTURAL LEVEL" value={`$${fmt(first(stop?.protectedLevel, stop?.level))}`} />
          <Metric label="DISTANCE" value={setup?.risk != null ? `${fmt(setup.risk)} pts` : "—"} />
          <Metric label="INVALIDATION" value={text(first(stop?.type, stop?.reason, setup?.thesis?.invalidation))} />
        </div>
        <p className="mt-3 rounded-2xl border border-red-400/10 bg-red-400/[.025] p-4 text-xs leading-5 text-zinc-500">
          {first(stop?.reason, setup?.thesis?.invalidation, analysis?.risk?.warnings?.[0])}
        </p>
      </Box>

      <Box title="Target Analysis" className="lg:col-span-2">
        <div className="grid gap-3 sm:grid-cols-3">
          {targets.slice(0, 3).map((target: any, index: number) => (
            <div key={index} className="rounded-2xl border border-zinc-900 bg-black/10 p-4">
              <div className="flex justify-between">
                <span className="font-mono text-[8px] text-zinc-500">TP{index + 1}</span>
                <span className="font-mono text-[8px] text-emerald-300">{target?.riskReward != null ? `${fmt(target.riskReward)} R` : "—"}</span>
              </div>
              <p className="mt-3 text-xl font-semibold text-emerald-300">${fmt(target?.price)}</p>
              <p className="mt-3 text-xs text-zinc-500">Liquidity: {text(first(target?.liquidityClass, target?.liquidityType, target?.source))}</p>
              <p className="mt-1 text-xs text-zinc-500">Timeframe: {text(target?.timeframe)}</p>
              <p className="mt-2 text-xs leading-5 text-zinc-600">{first(target?.reason, target?.explanation, target?.description)}</p>
            </div>
          ))}
          {!targets.length ? <p className="text-xs text-zinc-700">No published targets.</p> : null}
        </div>
      </Box>
    </div>
  );
}

function Quality({ analysis, setup }: { analysis: AnyData; setup: AnyData }) {
  const quality = setup?.quality || analysis?.setup || {};
  const components = quality?.components || {};

  return (
    <Box title="Quality Breakdown">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(components).map(([key, component]: [string, any]) => (
          <div key={key} className="rounded-2xl border border-zinc-900 bg-black/10 p-4">
            <div className="flex justify-between">
              <span className="font-mono text-[7px] text-zinc-600">{text(key)}</span>
              <span className="text-sm font-semibold text-zinc-200">
                {typeof component === "object" ? fmt(component?.score ?? component?.value) : fmt(component)}
              </span>
            </div>
            <p className="mt-2 text-[10px] leading-4 text-zinc-600">
              {typeof component === "object" ? first(component?.reason, component?.explanation) : "Engine quality component."}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Metric label="SCORE" value={`${fmt(quality?.score ?? analysis?.setup?.score, 0)} / 100`} />
        <Metric label="GRADE" value={quality?.grade || analysis?.setup?.grade || "—"} />
        <Metric label="CONFIDENCE" value={text(quality?.confidence || analysis?.setup?.confidence)} />
      </div>
    </Box>
  );
}

export default function SetupAnalysisPage({ setupId }: { setupId: string }) {
  const [setup, setSetup] = useState<AnyData | null>(null);
  const [analysis, setAnalysis] = useState<AnyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setError("Sign in to view setup analysis.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = await user.getIdToken();
      const response = await kitsetupsAuthFetch(`/api/analysis/setups/${encodeURIComponent(setupId)}`, token);
      const body = await response.json().catch(() => ({}));

      if (!response.ok || !body?.ok) {
        throw new Error(body?.error || "Unable to load setup analysis");
      }

      setSetup(body.data?.setup || null);
      setAnalysis(body.data?.analysis || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load setup analysis.");
    } finally {
      setLoading(false);
    }
  }, [setupId]);

  useEffect(() => {
    void auth.authStateReady().then(load);
  }, [load]);

  if (loading) {
    return (
      <StandaloneShell title="SETUP ANALYSIS">
        <div className="h-[70vh] animate-pulse rounded-3xl border border-zinc-900 bg-zinc-950/70" />
      </StandaloneShell>
    );
  }

  if (error || !setup || !analysis) {
    return (
      <StandaloneShell title="SETUP ANALYSIS">
        <div className="rounded-3xl border border-zinc-900 bg-zinc-950/70 p-8 text-center">
          <p className="text-sm text-zinc-300">{error || "Setup analysis is unavailable."}</p>
          <Link href="/setups" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2 text-xs text-zinc-300">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to setups
          </Link>
        </div>
      </StandaloneShell>
    );
  }

  const targets = Array.isArray(setup.targets) ? setup.targets.slice(0, 3) : [];
  const direction = text(setup.direction);
  const status = text(setup?.lifecycle?.status || analysis?.lifecycle?.status || setup.status);
  const directionClass = direction === "LONG" ? "text-emerald-300" : direction === "SHORT" ? "text-red-300" : "text-zinc-500";

  return (
    <StandaloneShell title="SETUP ANALYSIS">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/setups" className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-200">
          <ArrowLeft className="h-3.5 w-3.5" />
          All setups
        </Link>
        <button
          type="button"
          onClick={() => void load()}
          aria-label="Refresh setup analysis"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 text-zinc-500 hover:border-cyan-400/20 hover:text-cyan-300"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <header className="rounded-3xl border border-zinc-800/90 bg-[#07090b] p-5 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-[-.05em] text-zinc-100">{setup.symbol}</h1>
              <span className={`text-base font-semibold ${directionClass}`}>{direction}</span>
              <span className="rounded-full border border-zinc-800 px-2.5 py-1 font-mono text-[7px] tracking-[.13em] text-zinc-400">{text(setup.setupType)}</span>
            </div>
            <p className="mt-2 text-xs text-zinc-600">Complete engine intelligence for this setup.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-cyan-400/15 bg-cyan-400/[.04] px-3 py-2 font-mono text-[8px] text-cyan-200">
              {text(setup?.quality?.confidence || analysis?.setup?.confidence)} CONFIDENCE
            </span>
            <span className="rounded-full border border-zinc-800 px-3 py-2 font-mono text-[8px] text-zinc-300">GRADE {setup?.quality?.grade || analysis?.setup?.grade || "—"}</span>
            <span className="rounded-full border border-zinc-800 px-3 py-2 font-mono text-[8px] text-zinc-300">{status}</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Metric label="MARKET PRICE" value={`$${fmt(setup.price || analysis?.market?.price)}`} />
          <Metric label="ENTRY" value={`$${fmt(setup.entry || analysis?.levels?.entry)}`} tone="blue" />
          <Metric label="STOP" value={`$${fmt(setup.stop || analysis?.levels?.stop)}`} tone="red" />
          <Metric label="TP1" value={`$${fmt(targets[0]?.price)}`} tone="green" />
          <Metric label="TP2" value={`$${fmt(targets[1]?.price)}`} tone="green" />
          <Metric label="TP3" value={`$${fmt(targets[2]?.price)}`} tone="green" />
        </div>
      </header>

      <div className="mt-4 space-y-4">
        <Lifecycle setup={setup} analysis={analysis} />
        <Context analysis={analysis} />
        <Structure analysis={analysis} />
        <Liquidity analysis={analysis} />
        <EntryStopTargets analysis={analysis} setup={setup} />
        <Quality analysis={analysis} setup={setup} />

        <Box title="Setup Thesis">
          <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/[.025] p-5 text-sm leading-7 text-zinc-300">
            {first(setup?.thesis?.summary, setup?.thesis?.structural, setup?.thesis?.liquidity, setup?.thesis?.entry, analysis?.reasons?.join?.(" "))}
          </div>
        </Box>

        <Box title="Invalidation & Risks">
          <div className="flex gap-3 rounded-2xl border border-red-400/10 bg-red-400/[.025] p-5">
            <ShieldAlert className="h-4 w-4 shrink-0 text-red-300" />
            <div>
              <p className="text-sm font-medium text-zinc-200">What invalidates this setup?</p>
              <p className="mt-2 text-xs leading-5 text-zinc-500">
                {first(
                  setup?.thesis?.invalidation,
                  analysis?.risk?.warnings?.join?.(" "),
                  analysis?.reasons?.find?.((reason: any) => /invalid|conflict|risk/i.test(String(reason))),
                )}
              </p>
            </div>
          </div>
        </Box>
      </div>
    </StandaloneShell>
  );
}
