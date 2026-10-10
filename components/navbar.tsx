"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, ShieldCheck, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/mock-tests", label: "Mock Tests" },
  { href: "/practice", label: "Practice" },
  { href: "/merchandise", label: "Merchandise" },
  { href: "/analytics", label: "Analytics" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isAdmin = session?.user?.role === "ADMIN";
  const links = isAdmin ? [...LINKS, { href: "/admin", label: "Admin Panel" }] : LINKS;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-all duration-300",
        scrolled
          ? "border-slate-200 bg-background/90 backdrop-blur-xl shadow-lg shadow-slate-900/5 dark:border-white/[0.08] dark:shadow-[0_8px_30px_-12px_rgba(79,107,255,0.3)]"
          : "border-slate-200/60 bg-background/50 backdrop-blur-md dark:border-white/[0.05]"
      )}
    >
      <div className="container flex h-20 items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
          <span className="relative inline-flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 transition-transform group-hover:scale-105">
            <Image
              src="/brain-logo-mark.png"
              alt="EntranceLab"
              fill
              sizes="44px"
              priority
              className="object-contain drop-shadow-[0_2px_10px_rgba(79,107,255,0.4)]"
            />
          </span>
          <span className="font-heading font-semibold tracking-tight text-lg sm:text-xl">
            Entrance<span className="text-blue-600 dark:text-[#8FB4FF]">Lab</span>
          </span>
        </Link>

        {/* Segmented-pill nav — the active page gets a solid gradient chip
            (not just an underline), which reads as a far more deliberate,
            app-like piece of chrome than plain text links floating on the
            bar. Admin Panel gets its own gold tint when inactive so a
            privileged link doesn't blend into the regular nav items. */}
        <nav className="hidden md:flex items-center gap-0.5 rounded-full border border-slate-200/70 bg-slate-900/[0.02] p-1 dark:border-white/[0.06] dark:bg-white/[0.02]">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname?.startsWith(l.href);
            const admin = l.href === "/admin";
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative px-3.5 lg:px-4 py-2 text-sm lg:text-[14px] font-medium rounded-full whitespace-nowrap transition-colors",
                  active
                    ? "text-white"
                    : admin
                      ? "text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300"
                      : "text-muted-foreground hover:text-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="navbar-active-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-[#4F6BFF] to-[#8B5CF6] shadow-md shadow-[#4F6BFF]/30"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative inline-flex items-center gap-1.5">
                  {admin && <ShieldCheck className="h-3.5 w-3.5" />}
                  {l.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <ThemeToggle className="hidden md:inline-flex h-10 w-10" />
          {session ? (
            <ProfileMenu name={session.user?.name} email={session.user?.email} isAdmin={isAdmin} />
          ) : (
            <div className="flex items-center gap-2 md:gap-3">
              <Button asChild variant="ghost" className="px-3 md:px-3 lg:px-4">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="rounded-full px-4 md:px-5 lg:px-6">
                <Link href="/register">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// Single compact avatar trigger instead of separate "Account" + "Logout"
// buttons — cuts bar clutter and matches the avatar treatment already used
// on /account and the mobile menu, rather than introducing a third style.
function ProfileMenu({ name, email, isAdmin }: { name?: string | null; email?: string | null; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initial = (name || email || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.06]"
      >
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4F6BFF] to-[#8B5CF6] text-xs font-semibold text-white shadow-sm shadow-[#4F6BFF]/25">
          {initial}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            role="menu"
            className="glass absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-2xl shadow-xl"
          >
            <div className="border-b border-slate-200 p-4 dark:border-white/10">
              <p className="truncate text-sm font-semibold">{name || "Your account"}</p>
              {email && <p className="mt-0.5 truncate text-xs text-muted-foreground">{email}</p>}
              {isAdmin && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  <ShieldCheck className="h-3 w-3" /> Admin
                </span>
              )}
            </div>
            <div className="p-1.5">
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                role="menuitem"
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.06]"
              >
                <User className="h-4 w-4 text-muted-foreground" /> Account
              </Link>
              <button
                type="button"
                onClick={() => { setOpen(false); signOut(); }}
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
