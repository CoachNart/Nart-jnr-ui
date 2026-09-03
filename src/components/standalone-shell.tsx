"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, History, Home, UserRound, Radar } from "lucide-react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState, type ReactNode } from "react";
import { auth } from "../lib/firebase";

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/setups", label: "Setups", icon: Radar },
  { href: "/analysis", label: "Analysis", icon: BarChart3 },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: UserRound },
];

function MarketPulse() {
  return <div className="flex items-center gap-2" aria-label="Market pulse"><span className="relative flex h-5 w-5 items-center justify-center"><span className="absolute h-3 w-3 animate-ping rounded-full bg-emerald-400/30"/><span className="relative h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.85)]"/><span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,.85)]"/></span><span className="hidden font-mono text-[8px] font-medium tracking-[.18em] text-zinc-500 sm:block">LIVE PULSE</span></div>;
}

export default function StandaloneShell({ children, title }: { children: ReactNode; title?: string }) {
  const path = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    const boot = async () => {
      await auth.authStateReady();
      if (!active) return;
      const current = auth.currentUser;
      setUser(current);
      if (!current) { router.replace(`/auth?next=${encodeURIComponent(path)}`); return; }
      unsubscribe = onAuthStateChanged(auth, (u) => {
        if (!active) return;
        setUser(u);
        if (!u) router.replace(`/auth?next=${encodeURIComponent(path)}`);
      });
    };
    void boot();
    return () => { active = false; unsubscribe(); };
  }, [path, router]);

  return <div className="relative min-h-screen overflow-x-hidden bg-[#050607] text-white">
    <header className="fixed inset-x-0 top-0 z-[60] border-b border-white/[.07] bg-[#050607]/92 shadow-[0_10px_50px_rgba(0,0,0,.32)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[#050607]/72"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-5 md:px-8"><Link href="/" aria-label="KitSetups home" className="group flex items-center rounded-xl p-1 transition focus-visible:outline-offset-2"><img src="https://www.t3kit.xyz/assets/images/logo.webp" alt="KitSetups" className="h-9 w-9 rounded-lg object-contain transition duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_16px_rgba(34,211,238,.3)]"/></Link><div className="flex items-center gap-3 sm:gap-5"><MarketPulse/><Link href="/profile" aria-label="Open profile" className="h-9 w-9 overflow-hidden rounded-full border border-white/[.08] bg-zinc-950 shadow-[0_0_22px_rgba(34,211,238,.06)] transition duration-200 hover:scale-[1.03] hover:border-cyan-400/35 hover:shadow-[0_0_24px_rgba(34,211,238,.12)]">{user?.photoURL?<img src={user.photoURL} alt="Profile" className="h-full w-full object-cover"/>:<span className="flex h-full w-full items-center justify-center"><UserRound className="h-4 w-4 text-zinc-600"/></span>}</Link></div></div></header>
    <main className="relative z-[1] mx-auto max-w-6xl px-4 pb-32 pt-24 sm:px-5 md:px-8 md:pt-28">{title&&<div className="mb-7"><p className="font-mono text-[9px] font-medium tracking-[.28em] text-cyan-400/85">KITSETUPS</p><h1 className="mt-2 text-2xl font-semibold tracking-[-.025em] text-white md:text-3xl">{title}</h1><div className="nart-line mt-4 h-px w-full opacity-40"/></div>}{children}</main>
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[.07] bg-[#050607]/94 pb-[env(safe-area-inset-bottom)] shadow-[0_-18px_50px_rgba(0,0,0,.34)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[#050607]/78"><div className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 py-2 sm:px-3">{nav.map(({href,label,icon:Icon})=>{const active=path===href;return <Link key={href} href={href} aria-current={active?"page":undefined} className={`group relative flex min-h-14 flex-col items-center justify-center gap-1.5 rounded-2xl border px-1 py-2.5 text-[9px] font-mono tracking-wide transition-all duration-200 ${active?"border-cyan-300/20 bg-gradient-to-b from-cyan-300/[.10] to-cyan-300/[.035] text-cyan-300 shadow-[0_0_28px_rgba(34,211,238,.09),inset_0_1px_0_rgba(255,255,255,.035)]":"border-transparent text-zinc-600 hover:border-white/[.07] hover:bg-white/[.03] hover:text-zinc-300"}`}><span className={`flex h-7 w-7 items-center justify-center rounded-xl transition-all duration-200 ${active?"bg-cyan-300/[.12] text-cyan-300":"bg-white/[.025] text-zinc-600 group-hover:bg-white/[.055] group-hover:text-zinc-300"}`}><Icon className={`${active?"drop-shadow-[0_0_9px_rgba(34,211,238,.6)]":"transition-transform duration-200 group-hover:-translate-y-0.5"}`} size={16} strokeWidth={active?2.3:1.7}/></span><span>{label}</span>{active&&<span className="absolute inset-x-5 bottom-1 h-px rounded-full bg-cyan-300/90 shadow-[0_0_11px_rgba(34,211,238,.8)]"/>}</Link>})}</div></nav>
  </div>;
}
