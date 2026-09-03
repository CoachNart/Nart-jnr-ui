"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../lib/firebase";
import { securityHeaders } from "../../lib/device-security";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function backend(path: string, token: string, method = "GET") {
  const headers = { Authorization: `Bearer ${token}`, ...(method === "POST" ? await securityHeaders() : {}) };
  return fetch(`${API_BASE}${path}`, { method, headers, cache: "no-store" });
}

export default function AuthPage() {
  const router = useRouter();
  const [next, setNext] = useState("/");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("next");
    if (requested?.startsWith("/")) setNext(requested);
  }, []);

  const finish = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("Google authentication did not complete.");
    const token = await user.getIdToken(true);

    const account = await backend("/api/account", token);
    if (account.ok) {
      router.replace(next);
      router.refresh();
      return;
    }

    if (account.status === 404) {
      const response = await backend("/api/auth/register", token, "POST");
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.code === "DEVICE_ALREADY_REGISTERED") {
          setBlocked(true);
          setMessage(data.error || "This device already has a KitSetups account.");
        } else {
          setMessage(data.error || "We could not complete your KitSetups account setup.");
        }
        await auth.signOut();
        return;
      }
      router.replace(next);
      router.refresh();
      return;
    }

    await auth.signOut();
    throw new Error("We could not verify your KitSetups account. Please try again.");
  };

  const google = async () => {
    setBusy(true);
    setMessage("");
    setBlocked(false);
    try {
      await signInWithPopup(auth, googleProvider);
      await finish();
    } catch (error: any) {
      if (error?.code !== "auth/popup-closed-by-user") {
        setMessage(error?.message || "Google authentication failed. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020406] px-4 py-6 text-white sm:px-6">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(34,211,238,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.045)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="pointer-events-none absolute left-1/2 top-[-18rem] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-cyan-400/[.08] blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-48 -left-32 h-96 w-96 rounded-full bg-blue-700/[.08] blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-cyan-500/[.05] blur-[120px]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <section className="w-full max-w-[480px]">
          <div className="mb-7 flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="relative grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/[.05] shadow-[0_0_35px_rgba(34,211,238,.15)]">
                <img src="https://www.t3kit.xyz/assets/images/logo.webp" alt="KitSetups" className="h-8 w-8 rounded-lg object-contain" />
              </div>
              <div>
                <p className="font-mono text-[11px] font-bold tracking-[.28em] text-white">KITSETUPS</p>
                <p className="mt-0.5 font-mono text-[7px] tracking-[.24em] text-zinc-600">MARKET INTELLIGENCE</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-white/[.06] bg-white/[.02] px-3 py-1.5 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,.9)]" />
              <span className="font-mono text-[7px] tracking-[.2em] text-zinc-600">SECURE ACCESS</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[32px] border border-white/[.08] bg-[#070b0f]/90 shadow-[0_30px_100px_rgba(0,0,0,.55),0_0_90px_rgba(34,211,238,.06)] backdrop-blur-2xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
            <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-cyan-300/[.07] blur-3xl" />

            <div className="relative p-7 sm:p-10">
              <div className="mb-10">
                <div className="mb-7 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-[7px] tracking-[.25em] text-zinc-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_9px_rgba(34,211,238,.9)]" />
                    LIVE MARKET DESK
                  </div>
                  <span className="font-mono text-[7px] tracking-[.2em] text-zinc-700">01 / ACCESS</span>
                </div>
                <h1 className="text-[2.55rem] font-semibold leading-[1.02] tracking-[-.045em] sm:text-5xl">Your market<br /><span className="text-cyan-300">starts here.</span></h1>
                <p className="mt-5 max-w-sm text-sm leading-6 text-zinc-500">Live setups, market structure, analysis and history — in one focused trading workspace.</p>
              </div>

              {blocked ? (
                <div className="rounded-2xl border border-red-400/15 bg-red-400/[.035] p-5">
                  <p className="font-mono text-[9px] tracking-[.2em] text-red-300">ACCESS CONFLICT</p>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">{message}</p>
                  <button onClick={() => { setBlocked(false); setMessage(""); }} className="mt-5 w-full rounded-xl border border-white/[.08] bg-white/[.03] py-3 text-[10px] font-semibold tracking-wide text-zinc-300 transition hover:border-cyan-300/20 hover:text-white">TRY AGAIN</button>
                </div>
              ) : (
                <>
                  <button disabled={busy} onClick={google} className="group relative flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-white px-5 text-[12px] font-semibold tracking-wide text-[#101214] shadow-[0_14px_40px_rgba(0,0,0,.3)] transition duration-300 hover:-translate-y-0.5 hover:bg-zinc-100 hover:shadow-[0_18px_45px_rgba(34,211,238,.12)] disabled:cursor-wait disabled:opacity-60">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-[#f5f5f5] text-sm font-bold">G</span>
                    <span>{busy ? "VERIFYING ACCESS…" : "Continue with Google"}</span>
                    <span className="absolute inset-y-0 -left-20 w-16 skew-x-[-20deg] bg-white/70 transition-all duration-700 group-hover:left-[115%]" />
                  </button>

                  {message && <p className="mt-4 rounded-xl border border-red-400/15 bg-red-400/[.04] px-3 py-2.5 text-center text-[10px] leading-4 text-red-300">{message}</p>}

                  <div className="mt-8 grid grid-cols-3 gap-2">
                    {[
                      ["LIVE", "SETUPS"],
                      ["SMART", "ANALYSIS"],
                      ["TRADE", "HISTORY"],
                    ].map(([top, bottom]) => (
                      <div key={bottom} className="rounded-xl border border-white/[.05] bg-white/[.015] px-2 py-3 text-center">
                        <p className="font-mono text-[7px] tracking-[.18em] text-cyan-300/70">{top}</p>
                        <p className="mt-1 text-[8px] font-medium tracking-wide text-zinc-600">{bottom}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="mt-9 border-t border-white/[.05] pt-6">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-cyan-300/10 bg-cyan-300/[.03] text-cyan-300">✓</div>
                  <p className="text-[9px] leading-4 text-zinc-700">Google authentication only. Your identity is verified with Firebase and your KitSetups access is verified server-side.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-3 font-mono text-[7px] tracking-[.22em] text-zinc-800">
            <span>ENCRYPTED SESSION</span><span>·</span><span>SERVER VERIFIED</span><span>·</span><span>KITSETUPS</span>
          </div>
        </section>
      </div>
    </main>
  );
}
