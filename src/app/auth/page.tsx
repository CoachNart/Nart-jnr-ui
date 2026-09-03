"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getRedirectResult, signInWithPopup, signInWithRedirect, type User } from "firebase/auth";
import { auth, googleProvider } from "../../lib/firebase";
import { securityHeaders } from "../../lib/device-security";
import { kitsetupsAuthFetch } from "../../lib/api";

function MarketBackdrop() {
  const candles = [
    [8, 38, 8, 22, 29, 33], [18, 34, 8, 18, 27, 30], [28, 31, 9, 20, 23, 27],
    [38, 28, 8, 16, 21, 25], [48, 30, 10, 18, 25, 28], [58, 24, 9, 14, 18, 22],
    [68, 21, 8, 12, 16, 19], [78, 25, 10, 15, 21, 24], [88, 19, 9, 11, 16, 18],
  ];

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-[-18%] h-[560px] w-[760px] -translate-x-1/2 rounded-full bg-cyan-400/[.055] blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-8%] h-[420px] w-[520px] rounded-full bg-blue-500/[.035] blur-[110px]" />
      <svg className="absolute inset-0 h-full w-full opacity-[.13]" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <pattern id="auth-grid" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M 8 0 L 0 0 0 8" fill="none" stroke="white" strokeOpacity=".11" strokeWidth=".12" /></pattern>
          <linearGradient id="auth-line" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#22d3ee" stopOpacity="0" /><stop offset=".35" stopColor="#22d3ee" stopOpacity=".45" /><stop offset="1" stopColor="#67e8f9" stopOpacity=".12" /></linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#auth-grid)" />
        <path d="M0 73 C10 70 12 78 21 67 S34 70 43 57 S55 62 64 48 S76 52 86 35 S94 39 100 28" fill="none" stroke="url(#auth-line)" strokeWidth=".42" />
        <path d="M0 81 C12 79 19 84 30 76 S45 77 55 68 S68 73 78 58 S91 63 100 51" fill="none" stroke="white" strokeOpacity=".12" strokeWidth=".2" strokeDasharray="1.2 1.8" />
      </svg>
      <svg className="absolute -right-8 top-[13%] h-[360px] w-[480px] opacity-[.10]" viewBox="0 0 100 50" preserveAspectRatio="none">
        {candles.map(([x, high, low, open, close, bodyHigh], index) => {
          const rising = close > open;
          const bodyY = Math.min(open, close);
          const bodyH = Math.max(Math.abs(close - open), 1.8);
          return <g key={index}><line x1={x} y1={low} x2={x} y2={high} stroke="#67e8f9" strokeWidth=".45" /><rect x={x - 1.8} y={bodyY} width="3.6" height={bodyH} rx=".4" fill={rising ? "#22d3ee" : "#94a3b8"} fillOpacity=".72" /><line x1={x - 1.8} y1={bodyHigh} x2={x + 1.8} y2={bodyHigh} stroke="white" strokeOpacity=".25" strokeWidth=".25" /></g>;
        })}
        <path d="M2 38 C13 35 18 39 27 31 S40 34 49 24 S62 27 72 18 S84 22 98 8" fill="none" stroke="#22d3ee" strokeOpacity=".7" strokeWidth=".55" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#050607] via-[#050607]/80 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_18%,#050607_78%)]" />
    </div>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [next, setNext] = useState("/");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const finishing = useRef(false);

  const finish = async (user: User, target = next) => {
    if (finishing.current) return;
    finishing.current = true;
    setBusy(true);
    setMessage("");
    try {
      const token = await user.getIdToken(true);
      let account: Response;
      try {
        account = await kitsetupsAuthFetch("/api/account", token);
      } catch {
        // Firebase authentication is already complete. Do not sign the user out
        // because a temporary backend/network failure is not an auth failure.
        router.replace(target);
        router.refresh();
        return;
      }

      if (!account.ok && account.status === 404) {
        const response = await kitsetupsAuthFetch("/api/auth/register", token, { method: "POST", headers: await securityHeaders() });
        const data = await response.json().catch(() => ({}));
        if (response.status === 409 && data.code === "ACCOUNT_EXISTS") account = await kitsetupsAuthFetch("/api/account", token);
        else if (!response.ok) throw new Error(data.error || `Account setup failed (${response.status}).`);
        else { router.replace(target); router.refresh(); return; }
      }

      if (account.ok) {
        router.replace(target);
        router.refresh();
        return;
      }

      // A 5xx/503 means the backend is unhealthy, not that Firebase login failed.
      // Keep the Firebase session intact and let the destination retry its data calls.
      if (account.status >= 500) {
        router.replace(target);
        router.refresh();
        return;
      }

      const data = await account.json().catch(() => ({}));
      throw new Error(data.error || `Account verification failed (${account.status}).`);
    } catch (error: any) {
      finishing.current = false;
      const code = String(error?.code || "");
      // Only clear Firebase auth for an actual authentication failure.
      if (code.startsWith("auth/")) await auth.signOut().catch(() => undefined);
      setMessage(error?.message || "We could not complete Google authentication. Please try again.");
      setBusy(false);
    }
  };

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("next");
    const target = requested?.startsWith("/") ? requested : "/";
    setNext(target);
    let active = true;
    const complete = async () => {
      try {
        await auth.authStateReady();
        const result = await getRedirectResult(auth);
        if (!active) return;
        if (result?.user) { await finish(result.user, target); return; }
        if (auth.currentUser) await finish(auth.currentUser, target);
      } catch (error: any) {
        if (active) { setMessage(error?.message || "Google authentication failed. Please try again."); setBusy(false); finishing.current = false; }
      }
    };
    void complete();
    return () => { active = false; };
  }, []);

  const google = async () => {
    setBusy(true);
    setMessage("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await finish(result.user);
    } catch (error: any) {
      const code = String(error?.code || "");
      if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
        try { await signInWithRedirect(auth, googleProvider); return; }
        catch (redirectError: any) { setMessage(redirectError?.message || "Google authentication failed. Please try again."); }
      } else setMessage(error?.message || "Google authentication failed. Please try again.");
      setBusy(false);
      finishing.current = false;
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050607] text-white">
      <MarketBackdrop />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-5 py-10">
        <section className="w-full max-w-[400px]">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/10 bg-white/[.035] shadow-[0_0_30px_rgba(34,211,238,.08)]"><img src="https://www.t3kit.xyz/assets/images/logo.webp" alt="KitSetups" className="h-8 w-8 rounded-lg object-contain" /></div>
            <h1 className="text-[27px] font-semibold tracking-[-.04em]">KitSetups</h1>
            <p className="mt-2 text-[13px] text-zinc-500">A cleaner way to read the market.</p>
          </div>
          <div className="rounded-[22px] border border-white/[.09] bg-[#0b0d0f]/90 p-7 shadow-[0_24px_80px_rgba(0,0,0,.55),0_0_45px_rgba(34,211,238,.035)] backdrop-blur-xl sm:p-8">
            <h2 className="text-[15px] font-medium text-zinc-200">Welcome back</h2>
            <p className="mt-2 text-[12px] leading-5 text-zinc-600">Sign in to continue to your market workspace.</p>
            <button type="button" disabled={busy} onClick={google} className="group relative mt-7 flex h-12 w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-white text-[13px] font-medium text-[#161719] shadow-[0_8px_24px_rgba(0,0,0,.2)] transition hover:bg-zinc-50 hover:shadow-[0_10px_30px_rgba(234,67,53,.12)] disabled:cursor-wait disabled:opacity-60">
              <span className="text-[17px] font-bold text-[#EA4335] transition-transform duration-200 group-hover:scale-105">G</span>
              <span>{busy ? "Connecting…" : "Continue with Google"}</span>
              <span className="absolute inset-x-10 bottom-0 h-px bg-[#EA4335]/35 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
            {message && <div className="mt-4 rounded-xl border border-red-400/15 bg-red-400/[.04] px-4 py-3 text-center text-[11px] leading-5 text-red-300">{message}</div>}
            <p className="mt-7 text-center text-[10px] leading-4 text-zinc-700">Secure Google authentication. No passwords required.</p>
          </div>
          <p className="mt-6 text-center text-[9px] tracking-[.18em] text-zinc-800">KITSETUPS</p>
        </section>
      </div>
    </main>
  );
}
