"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Home, ClipboardList, BookOpen, BarChart3, LogIn, LogOut } from "lucide-react";
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
        <Link
          href="/login"
          aria-label="Login"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-purple-500/30 text-white active:scale-95 transition"
        >
          <LogIn className="h-5 w-5" />
        </Link>
      )}
    </div>
  );
}
