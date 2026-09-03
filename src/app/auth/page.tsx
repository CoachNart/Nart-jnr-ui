"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "../../lib/firebase";
import { securityHeaders } from "../../lib/device-security";
import { kitsetupsAuthFetch } from "../../lib/api";

export default function AuthPage() {
  const router = useRouter();
  const [next, setNext] = useState("/");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const finishing = useRef(false);

  const finish = async (user: User) => {
    if (finishing.current) return;
    finishing.current = true;
    setBusy(true);
    setMessage("");

    try {
      const token = await user.getIdToken(true);
      const account = await kitsetupsAuthFetch("/api/account", token);

      if (account.ok) {
        router.replace(next);
        router.refresh();
        return;
      }

      if (account.status === 404) {
        const response = await kitsetupsAuthFetch("/api/auth/register", token, {
          method: "POST",
          headers: await securityHeaders(),
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || `Account setup failed (${response.status}).`);
        }

        router.replace(next);
        router.refresh();
        return;
      }

      const data = await account.json().catch(() => ({}));
      throw new Error(data.error || `Account verification failed (${account.status}).`);
    } catch (error: any) {
      finishing.current = false;
      await auth.signOut().catch(() => undefined);
      setMessage(error?.message || "We could not complete Google authentication. Please try again.");
      setBusy(false);
    }
  };

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("next");
    if (requested?.startsWith("/")) setNext(requested);

    let active = true;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (active && user) void finish(user);
    });

    const completeRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (active && result?.user) void finish(result.user);
      } catch (error: any) {
        if (active) {
          setMessage(error?.message || "Google authentication failed. Please try again.");
          setBusy(false);
        }
      }
    };

    void completeRedirect();

    return () => {
      active = false;
      unsubscribe();
    };
  }, [next]);

  const google = async () => {
    setBusy(true);
    setMessage("");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      await finish(result.user);
    } catch (error: any) {
      const code = String(error?.code || "");

      if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectError: any) {
          setMessage(redirectError?.message || "Google authentication failed. Please try again.");
        }
      } else {
        setMessage(error?.message || "Google authentication failed. Please try again.");
      }

      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050607] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-5 py-10">
        <section className="w-full max-w-[400px]">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[.035]">
              <img src="https://www.t3kit.xyz/assets/images/logo.webp" alt="KitSetups" className="h-8 w-8 rounded-lg object-contain" />
            </div>
            <h1 className="text-[27px] font-semibold tracking-[-.04em]">KitSetups</h1>
            <p className="mt-2 text-[13px] text-zinc-500">A cleaner way to read the market.</p>
          </div>

          <div className="rounded-[22px] border border-white/[.08] bg-[#0b0d0f] p-7 shadow-[0_24px_70px_rgba(0,0,0,.4)] sm:p-8">
            <h2 className="text-[15px] font-medium text-zinc-200">Welcome back</h2>
            <p className="mt-2 text-[12px] leading-5 text-zinc-600">Sign in to continue to your market workspace.</p>

            <button
              type="button"
              disabled={busy}
              onClick={google}
              className="mt-7 flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-white text-[13px] font-medium text-[#161719] transition hover:bg-zinc-100 disabled:cursor-wait disabled:opacity-60"
            >
              <span className="text-[16px] font-semibold">G</span>
              {busy ? "Connecting…" : "Continue with Google"}
            </button>

            {message && (
              <div className="mt-4 rounded-xl border border-red-400/15 bg-red-400/[.04] px-4 py-3 text-center text-[11px] leading-5 text-red-300">
                {message}
              </div>
            )}

            <p className="mt-7 text-center text-[10px] leading-4 text-zinc-700">
              Secure Google authentication. No passwords required.
            </p>
          </div>

          <p className="mt-6 text-center text-[9px] tracking-[.18em] text-zinc-800">KITSETUPS</p>
        </section>
      </div>
    </main>
  );
}
