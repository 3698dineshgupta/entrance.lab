"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Home, ClipboardList, BookOpen, BarChart3, Menu, LogOut, LogIn, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/mock-tests", label: "Mock Tests", icon: ClipboardList },
  { href: "/practice", label: "Practice", icon: BookOpen },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function MobileFloatingNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="md:hidden fixed inset-x-0 bottom-4 z-40 flex items-center justify-center gap-3 px-4 pb-[env(safe-area-inset-bottom)]">
      <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-background/80 backdrop-blur-xl px-2 py-2 shadow-2xl shadow-black/40">
        {TABS.map((tab) => {
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
                  active ? "bg-white/10 text-white" : "text-muted-foreground"
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

      {session ? (
        <button
          onClick={() => signOut()}
          aria-label="Logout"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-purple-500/30 text-white active:scale-95 transition"
        >
          <LogOut className="h-5 w-5" />
        </button>
      ) : (
        <div className="relative shrink-0">
          {menuOpen && (
            <>
              <button
                aria-label="Close menu"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute bottom-full right-0 mb-3 z-50 flex w-40 flex-col gap-2 rounded-2xl border border-white/10 bg-background/95 backdrop-blur-xl p-2 shadow-2xl shadow-black/40">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-white/[0.06] transition"
                >
                  <LogIn className="h-4 w-4" /> Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium bg-gradient-to-br from-blue-500 to-purple-500 text-white hover:opacity-90 transition"
                >
                  <UserPlus className="h-4 w-4" /> Sign Up
                </Link>
              </div>
            </>
          )}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            className="relative z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-purple-500/30 text-white active:scale-95 transition"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
