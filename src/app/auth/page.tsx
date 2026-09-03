"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
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
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("next");
    if (requested?.startsWith("/")) setNext(requested);
  }, []);

  const finish = async (isNew: boolean) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Authentication did not complete.");
    const token = await user.getIdToken(true);

    if (isNew) {
      const response = await backend("/api/auth/register", token, "POST");
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.code === "DEVICE_ALREADY_REGISTERED") {
          setBlocked(true);
          setMessage(data.error || "This device already has a KitSetups account.");
        } else setMessage(data.error || "We could not complete registration.");
        await deleteUser(user).catch(() => undefined);
        return;
      }
    } else {
      const response = await backend("/api/account", token);
      if (!response.ok) {
        await auth.signOut();
        setMessage(response.status === 404 ? "This login is not registered for KitSetups. Please create your KitSetups account first." : "We could not verify your KitSetups account. Please try again.");
        return;
      }
    }
    router.replace(next);
    router.refresh();
  };

  const submit = async () => {
    setBusy(true); setMessage(""); setBlocked(false);
    try {
      if (mode === "signup") {
        if (!name.trim()) throw new Error("Enter your name.");
        if (password.length < 6) throw new Error("Use at least 6 characters for your password.");
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(credential.user, { displayName: name.trim() });
        await finish(true);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        await finish(false);
      }
    } catch (error: any) {
      setMessage(error?.message || "Authentication failed. Please try again.");
    } finally { setBusy(false); }
  };

  const google = async () => {
    setBusy(true); setMessage(""); setBlocked(false);
    try {
      await signInWithPopup(auth, googleProvider);
      await finish(mode === "signup");
    } catch (error: any) {
      setMessage(error?.message || "Google authentication failed. Please try again.");
    } finally { setBusy(false); }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030609] px-4 py-8 text-white sm:px-6">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(34,211,238,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.045)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="pointer-events-none absolute -left-32 top-[-15%] h-96 w-96 rounded-full bg-cyan-400/10 blur-[110px]" />
      <div className="pointer-events-none absolute -right-32 bottom-[-10%] h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <section className="grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-cyan-400/10 bg-black/55 shadow-[0_0_100px_rgba(34,211,238,.08)] backdrop-blur-2xl lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative hidden min-h-[620px] overflow-hidden border-r border-white/5 p-10 lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(34,211,238,.12),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(37,99,235,.1),transparent_40%)]" />
            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-1 shadow-[0_0_35px_rgba(34,211,238,.2)]">
                  <img src="https://www.t3kit.xyz/assets/images/logo.webp" alt="KitSetups" className="h-full w-full rounded-xl object-contain" />
                </div>
                <div><p className="font-mono text-[10px] tracking-[.3em] text-cyan-300">KITSETUPS</p><p className="mt-1 text-[10px] text-zinc-500">MARKET INTELLIGENCE</p></div>
              </div>
              <div className="mt-28 max-w-md">
                <p className="font-mono text-[10px] tracking-[.3em] text-cyan-400">YOUR MARKET DESK</p>
                <h2 className="mt-4 text-5xl font-semibold leading-[1.05] tracking-tight">Trade with<br /><span className="text-cyan-300">context.</span></h2>
                <p className="mt-6 max-w-sm text-sm leading-7 text-zinc-500">One workspace for live setups, market structure, analysis and trade history.</p>
              </div>
            </div>
            <div className="relative flex items-center gap-3 font-mono text-[9px] tracking-widest text-zinc-600"><span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,.8)]" />SECURE ACCESS · SERVER VERIFIED</div>
          </div>

          <div className="flex items-center p-5 sm:p-8 lg:p-10">
            <div className="w-full">
              <div className="text-center lg:text-left">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/5 shadow-[0_0_40px_rgba(34,211,238,.16)] lg:mx-0">
                  <img src="https://www.t3kit.xyz/assets/images/logo.webp" alt="KitSetups" className="h-10 w-10 rounded-xl object-contain" />
                </div>
                <p className="mt-6 font-mono text-[9px] tracking-[.32em] text-cyan-400">{mode === "signup" ? "CREATE ACCESS" : "SECURE LOGIN"}</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">{blocked ? "Account already registered" : mode === "signup" ? "Enter the desk" : "Welcome back"}</h1>
                <p className="mt-2 text-xs leading-5 text-zinc-600">{blocked ? "This device is already associated with a registered KitSetups account." : mode === "signup" ? "Create your secure account and enter your market workspace." : "Sign in to your registered KitSetups account."}</p>
              </div>

              {blocked ? (
                <div className="mt-8 rounded-2xl border border-red-400/15 bg-red-400/[.04] p-5 text-center lg:text-left">
                  <p className="font-mono text-[10px] tracking-widest text-red-300">REGISTERED ACCOUNT DETECTED</p>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">{message}</p>
                  <button onClick={() => { setBlocked(false); setMode("signin"); setMessage(""); }} className="mt-5 w-full rounded-xl bg-cyan-300 px-4 py-3 text-xs font-semibold text-black shadow-[0_0_28px_rgba(34,211,238,.18)] transition hover:bg-cyan-200">SIGN IN TO EXISTING ACCOUNT</button>
                </div>
              ) : (
                <>
                  <div className="mt-8 space-y-3">
                    {mode === "signup" && <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" autoComplete="name" className="h-12 w-full rounded-xl border border-white/8 bg-white/[.025] px-4 text-xs text-white outline-none transition placeholder:text-zinc-700 focus:border-cyan-300/40 focus:bg-cyan-300/[.025] focus:shadow-[0_0_25px_rgba(34,211,238,.06)]" />}
                    <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email address" autoComplete="email" className="h-12 w-full rounded-xl border border-white/8 bg-white/[.025] px-4 text-xs text-white outline-none transition placeholder:text-zinc-700 focus:border-cyan-300/40 focus:bg-cyan-300/[.025] focus:shadow-[0_0_25px_rgba(34,211,238,.06)]" />
                    <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" autoComplete={mode === "signup" ? "new-password" : "current-password"} className="h-12 w-full rounded-xl border border-white/8 bg-white/[.025] px-4 text-xs text-white outline-none transition placeholder:text-zinc-700 focus:border-cyan-300/40 focus:bg-cyan-300/[.025] focus:shadow-[0_0_25px_rgba(34,211,238,.06)]" />
                    <button disabled={busy} onClick={submit} className="group relative h-12 w-full overflow-hidden rounded-xl bg-cyan-300 px-4 text-xs font-bold tracking-wide text-black shadow-[0_0_35px_rgba(34,211,238,.16)] transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-50"><span className="relative z-10">{busy ? "VERIFYING ACCESS…" : mode === "signup" ? "CREATE ACCOUNT" : "SIGN IN"}</span><span className="absolute inset-y-0 -left-20 w-16 skew-x-[-20deg] bg-white/40 transition-all duration-700 group-hover:left-[110%]" /></button>
                  </div>
                  <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-white/6"/><span className="font-mono text-[8px] text-zinc-700">OR CONTINUE WITH</span><span className="h-px flex-1 bg-white/6"/></div>
                  <button disabled={busy} onClick={google} className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/8 bg-white/[.02] text-xs font-medium text-zinc-300 transition hover:border-cyan-300/20 hover:bg-white/[.04] hover:text-white disabled:opacity-50"><span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[11px] font-bold text-black">G</span>CONTINUE WITH GOOGLE</button>
                  {message && <p className="mt-3 rounded-xl border border-red-400/15 bg-red-400/[.04] px-3 py-2.5 text-center text-[10px] leading-4 text-red-300">{message}</p>}
                  <button onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setMessage(""); }} className="mt-6 w-full text-center font-mono text-[9px] tracking-wide text-zinc-600 transition hover:text-cyan-300">{mode === "signup" ? "ALREADY REGISTERED? SIGN IN" : "NEW TO KITSETUPS? CREATE ACCOUNT"}</button>
                </>
              )}
              <p className="mt-7 text-center text-[8px] leading-4 text-zinc-800 lg:text-left">Access is verified server-side. Creating additional accounts does not create additional KitSetups data access.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
