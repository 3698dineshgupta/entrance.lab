"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
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

  const links = session?.user?.role === "ADMIN"
    ? [...LINKS, { href: "/admin", label: "Admin Panel" }]
    : LINKS;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-all duration-300",
        scrolled
          ? "border-slate-200 bg-background/90 backdrop-blur-xl shadow-lg shadow-slate-900/5 dark:border-white/[0.08] dark:shadow-black/20"
          : "border-slate-200/60 bg-background/40 backdrop-blur-md dark:border-white/[0.04]"
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group shrink-0">
          <span className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-105">
            <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </span>
          <span className="font-semibold tracking-tight text-base sm:text-lg">
            Entrance<span className="text-blue-600 dark:text-blue-400">Lab</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-0.5 lg:gap-1">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative px-1.5 lg:px-3 py-2 text-[13px] lg:text-sm transition rounded-md whitespace-nowrap",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {l.label}
                {active && (
                  <motion.span
                    layoutId="navbar-active"
                    className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-gradient-to-r from-blue-400 to-cyan-300"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Auth actions — same on every breakpoint. Section/page links live in
            the desktop nav above and in the global bottom nav on mobile
            (components/mobile-floating-nav.tsx), so this bar can stay
            focused on the two highest-intent actions instead of a hamburger. */}
        <div className="flex items-center gap-1 md:gap-1.5 lg:gap-2 shrink-0">
          {/* Desktop only here — the mobile top row is already tight (logo +
              Sign In + Sign Up at 320px), so on mobile the toggle lives in
              the bottom-nav drawer instead (components/mobile-floating-nav.tsx). */}
          <ThemeToggle className="hidden md:inline-flex" />
          {session ? (
            <Button size="sm" variant="secondary" onClick={() => signOut()}>
              Logout
            </Button>
          ) : (
            <div className="flex items-center gap-1 md:gap-1.5 lg:gap-2">
              <Button asChild size="sm" variant="ghost" className="px-2 md:px-2 lg:px-3">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full px-2.5 md:px-3 lg:px-4">
                <Link href="/register">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
