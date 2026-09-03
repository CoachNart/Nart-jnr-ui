"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { auth, googleProvider } from "../../lib/firebase";
import { securityHeaders } from "../../lib/device-security";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function backend(path: string, token: string, method = "GET") {
  const headers = { Authorization: `Bearer ${token}`, ...(method === "POST" ? await securityHeaders() : {}) };
  return fetch(`${API_BASE}${path}`, { method, headers });
}

export default function AuthPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [blocked, setBlocked] = useState(false);

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
        } else {
          setMessage(data.error || "We could not complete registration.");
        }
        await deleteUser(user).catch(() => undefined);
        return;
      }
    } else {
      const response = await backend("/api/account", token);
      if (!response.ok) {
        await auth.signOut();
        if (response.status === 404) {
          setMessage("This login is not registered for KitSetups. Please create your KitSetups account first.");
        } else {
          setMessage("We could not verify your KitSetups account. Please try again.");
        }
        return;
      }
    }

    router.replace(next);
    router.refresh();
  };

  const submit = async () => {
    setBusy(true);
    setMessage("");
    setBlocked(false);
    try {
      if (mode === "signup") {
        if (!name.trim()) throw new Error("Enter your name.");
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(credential.user, { displayName: name.trim() });
        await finish(true);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        await finish(false);
      }
    } catch (error: any) {
      setMessage(error?.message || "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    setMessage("");
    setBlocked(false);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await finish(mode === "signup");
    } catch (error: any) {
      setMessage(error?.message || "Google authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
        <section className="w-full rounded-3xl border border-zinc-800/80 bg-zinc-950/90 p-5 shadow-[0_25px_90px_rgba(0,0,0,.4)] sm:p-7">
          <div className="text-center">
            <img src="https://www.t3kit.xyz/assets/images/logo.webp" alt="KitSetups" className="mx-auto h-12 w-12 rounded-xl object-contain" />
            <p className="mt-5 font-mono text-[9px] tracking-[.25em] text-cyan-400">KITSETUPS</p>
            <h1 className="mt-2 text-2xl font-semibold">{blocked ? "Account already registered" : mode === "signup" ? "Create your account" : "Welcome back"}</h1>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-zinc-600">
              {blocked ? "This device is already associated with a registered KitSetups account." : mode === "signup" ? "One account per device. Your account controls access to KitSetups data." : "Sign in to your registered KitSetups account."}
            </p>
          </div>

          {blocked ? (
            <div className="mt-7 rounded-2xl border border-red-500/20 bg-red-500/[.05] p-4 text-center">
              <p className="text-sm font-medium text-red-300">REGISTERED ACCOUNT DETECTED</p>
              <p className="mt-2 text-xs leading-5 text-zinc-500">{message}</p>
              <button onClick={() => { setBlocked(false); setMode("signin"); setMessage(""); }} className="mt-4 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-semibold text-black">SIGN IN TO EXISTING ACCOUNT</button>
            </div>
          ) : (
            <>
              {mode === "signup" && <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className="mt-7 w-full rounded-xl border border-zinc-800 bg-black/50 px-3 py-3 text-xs text-white outline-none placeholder:text-zinc-700 focus:border-cyan-400/30" />}
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email address" className="mt-3 w-full rounded-xl border border-zinc-800 bg-black/50 px-3 py-3 text-xs text-white outline-none placeholder:text-zinc-700 focus:border-cyan-400/30" />
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" className="mt-3 w-full rounded-xl border border-zinc-800 bg-black/50 px-3 py-3 text-xs text-white outline-none placeholder:text-zinc-700 focus:border-cyan-400/30" />
              <button disabled={busy} onClick={submit} className="mt-4 w-full rounded-xl bg-cyan-400 px-4 py-3 text-xs font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-50">{busy ? "VERIFYING…" : mode === "signup" ? "CREATE ACCOUNT" : "SIGN IN"}</button>
              <div className="my-4 flex items-center gap-3"><span className="h-px flex-1 bg-zinc-900"/><span className="font-mono text-[8px] text-zinc-700">OR</span><span className="h-px flex-1 bg-zinc-900"/></div>
              <button disabled={busy} onClick={google} className="w-full rounded-xl border border-zinc-800 bg-black/30 px-4 py-3 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white disabled:opacity-50">CONTINUE WITH GOOGLE</button>
              {message && <p className="mt-3 rounded-xl border border-red-500/15 bg-red-500/[.04] px-3 py-2.5 text-center text-[10px] leading-4 text-red-300">{message}</p>}
              <button onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setMessage(""); }} className="mt-5 w-full text-center font-mono text-[9px] tracking-wide text-zinc-600 hover:text-cyan-400">{mode === "signup" ? "ALREADY REGISTERED? SIGN IN" : "NEW TO KITSETUPS? CREATE ACCOUNT"}</button>
            </>
          )}
          <p className="mt-6 text-center text-[8px] leading-4 text-zinc-800">Access is verified server-side. Creating additional accounts does not create additional KitSetups data access.</p>
        </section>
      </div>
    </main>
  );
}
