"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home, ClipboardList, BookOpen, BarChart3, ShoppingBag, Menu, X,
  LogOut, LogIn, UserPlus, ArrowRight, GraduationCap, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

// The quick-access pill only has room for the four highest-traffic
// destinations; Merchandise is still reachable from the full menu below.
const PILL_TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/mock-tests", label: "Mock Tests", icon: ClipboardList },
  { href: "/practice", label: "Practice", icon: BookOpen },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const MENU_TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/mock-tests", label: "Mock Tests", icon: ClipboardList },
  { href: "/practice", label: "Practice", icon: BookOpen },
  { href: "/merchandise", label: "Merchandise", icon: ShoppingBag },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function MobileFloatingNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const initial = (session?.user?.name || session?.user?.email || "?").trim().charAt(0).toUpperCase();

  // Lock body scroll while the sidebar is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <div className="md:hidden fixed inset-x-0 bottom-4 z-40 flex items-center justify-center gap-3 px-4 pb-[env(safe-area-inset-bottom)]">
      <nav className="flex items-center gap-1 rounded-full border border-slate-200 bg-background/80 backdrop-blur-xl px-2 py-2 shadow-2xl shadow-slate-900/10 dark:border-white/10 dark:shadow-black/40">
        {PILL_TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname?.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              className="relative flex flex-col items-center justify-center gap-1 px-3.5 py-2 rounded-full transition"
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition",
                  active ? "bg-slate-900/[0.06] text-foreground dark:bg-white/10 dark:text-white" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span
                className={cn(
                  "h-0.5 w-4 rounded-full transition",
                  active ? "bg-gradient-to-r from-blue-400 to-purple-400" : "bg-transparent"
                )}
              />
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => setMenuOpen(true)}
        aria-label="Menu"
        aria-expanded={menuOpen}
        className="relative shrink-0 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-purple-500/30 text-white active:scale-95 transition"
      >
        <Menu className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-xs flex-col border-r border-slate-200 bg-white/97 backdrop-blur-2xl dark:border-white/10 dark:bg-[#070B14]/97"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))] dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
                    <GraduationCap className="h-4 w-4 text-white" />
                  </span>
                  <span className="font-semibold tracking-tight">
                    Entrance<span className="text-blue-400">Lab</span>
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <ThemeToggle />
                  <button
                    onClick={() => setMenuOpen(false)}
                    aria-label="Close menu"
                    className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-white/5"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-6 space-y-7">
                {/* Promo banner */}
                <Link
                  href="/mock-tests"
                  onClick={() => setMenuOpen(false)}
                  className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3.5 shadow-lg shadow-blue-600/20 transition active:scale-[0.99]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    <ClipboardList className="h-[18px] w-[18px] text-white" />
                  </span>
                  <span className="flex-1 text-sm font-semibold text-white">Start a Mock Test</span>
                  <ArrowRight className="h-4 w-4 text-white/90 transition-transform group-hover:translate-x-0.5" />
                </Link>

                {/* Profile */}
                {session ? (
                  <div className="flex items-center gap-3 pb-1">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-lg font-semibold text-white ring-2 ring-slate-200 dark:ring-white/10">
                      {initial}
                    </span>
                    <div className="min-w-0">
                      <p className="text-base font-semibold truncate">{session.user?.name || "Your account"}</p>
                      {session.user?.email && (
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3 shrink-0" /> {session.user.email}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sign in to save your progress and see your analytics.</p>
                )}

                {/* Nav links — plain rows like a real sidebar, not a boxed card */}
                <nav className="space-y-1">
                  {MENU_TABS.map((tab, i) => {
                    const Icon = tab.icon;
                    const active = tab.href === "/" ? pathname === "/" : pathname?.startsWith(tab.href);
                    return (
                      <motion.div
                        key={tab.href}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: 0.05 + i * 0.03 }}
                      >
                        <Link
                          href={tab.href}
                          onClick={() => setMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3.5 rounded-xl px-2.5 py-3 text-[15px] font-medium transition",
                            active ? "text-foreground" : "text-slate-500 hover:text-foreground dark:text-neutral-300 dark:hover:text-white"
                          )}
                        >
                          <Icon className={cn("h-5 w-5", active ? "text-blue-500 dark:text-blue-400" : "text-slate-400 dark:text-neutral-500")} />
                          {tab.label}
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>
              </div>

              {/* Auth action — pinned to the bottom of the sidebar */}
              <div className="border-t border-slate-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-white/[0.06]">
                {session ? (
                  <button
                    onClick={() => { setMenuOpen(false); signOut(); }}
                    className="w-full rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-500/15 to-red-600/10 px-4 py-3 text-sm font-semibold text-red-300 transition active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <Button asChild variant="secondary" className="flex-1">
                      <Link href="/login" onClick={() => setMenuOpen(false)}><LogIn className="h-4 w-4" /> Sign In</Link>
                    </Button>
                    <Button asChild className="flex-1 rounded-full">
                      <Link href="/register" onClick={() => setMenuOpen(false)}><UserPlus className="h-4 w-4" /> Sign Up</Link>
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
