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
  return <div className="flex items-center gap-2" aria-label="Market pulse"><span className="relative flex h-5 w-5 items-center justify-center"><span className="absolute h-3 w-3 animate-ping rounded-full bg-emerald-400/20"/><span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.8)]"/></span><span className="hidden font-mono text-[8px] font-medium tracking-[.18em] text-zinc-600 sm:block">LIVE</span></div>;
}

export default function StandaloneShell({ children }: { children: ReactNode; title?: string }) {
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
    <header className="fixed inset-x-0 top-0 z-[60] border-b border-white/[.055] bg-[#050607]/90 shadow-[0_8px_40px_rgba(0,0,0,.28)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[#050607]/70"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-5 md:px-8"><Link href="/" aria-label="KitSetups home" className="group flex items-center rounded-xl p-1"><img src="https://www.t3kit.xyz/assets/images/logo.webp" alt="KitSetups" className="h-9 w-9 rounded-lg object-contain transition duration-300 group-hover:drop-shadow-[0_0_14px_rgba(34,211,238,.22)]"/></Link><div className="flex items-center gap-3 sm:gap-5"><MarketPulse/><Link href="/profile" aria-label="Open profile" className="h-9 w-9 overflow-hidden rounded-full border border-white/[.08] bg-zinc-950 shadow-[0_0_18px_rgba(34,211,238,.045)] transition hover:border-cyan-400/25">{user?.photoURL?<img src={user.photoURL} alt="Profile" className="h-full w-full object-cover"/>:<span className="flex h-full w-full items-center justify-center"><UserRound className="h-4 w-4 text-zinc-600"/></span>}</Link></div></div></header>
    <main className="relative z-[1] mx-auto max-w-6xl px-4 pb-28 pt-24 sm:px-5 md:px-8 md:pt-28">{children}</main>
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[.06] bg-[#050607]/92 pb-[env(safe-area-inset-bottom)] shadow-[0_-14px_40px_rgba(0,0,0,.3)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[#050607]/78"><div className="mx-auto flex max-w-xl items-center justify-between px-5 py-2.5 sm:px-8">{nav.map(({href,label,icon:Icon})=>{const active=path===href;return <Link key={href} href={href} aria-current={active?"page":undefined} className={`group relative flex min-w-12 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 transition-colors duration-150 ${active?"text-cyan-300":"text-zinc-600 hover:text-zinc-400"}`}><span className={`relative flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-150 ${active?"bg-cyan-300/[.07] text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,.08)]":"bg-transparent"}`}><Icon size={17} strokeWidth={active?2:1.65}/>{active&&<span className="absolute -bottom-1 h-px w-4 rounded-full bg-cyan-300/80 shadow-[0_0_8px_rgba(34,211,238,.7)]"/>}</span><span className={`font-mono text-[8px] tracking-[.04em] ${active?"text-cyan-300/90":"text-zinc-600"}`}>{label}</span></Link>})}</div></nav>
  </div>;
}
