"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
          ? "border-slate-200 bg-background/90 backdrop-blur-xl shadow-lg shadow-slate-900/5 dark:border-white/[0.08] dark:shadow-[0_8px_30px_-12px_rgba(79,107,255,0.25)]"
          : "border-slate-200/60 bg-background/40 backdrop-blur-md dark:border-white/[0.04]"
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

        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "group relative px-3 lg:px-4 py-2.5 text-sm lg:text-[15px] font-medium transition rounded-md whitespace-nowrap",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {l.label}
                {active ? (
                  <motion.span
                    layoutId="navbar-active"
                    className="absolute inset-x-3 -bottom-[1px] h-[2.5px] rounded-full bg-gradient-to-r from-[#4F6BFF] to-[#3DD9FF]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                ) : (
                  <span className="absolute inset-x-3 -bottom-[1px] h-[2.5px] scale-x-0 rounded-full bg-gradient-to-r from-[#4F6BFF]/60 to-[#3DD9FF]/60 transition-transform duration-300 group-hover:scale-x-100" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Auth actions — same on every breakpoint. Section/page links live in
            the desktop nav above and in the global bottom nav on mobile
            (components/mobile-floating-nav.tsx), so this bar can stay
            focused on the two highest-intent actions instead of a hamburger. */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Desktop only here — the mobile top row is already tight (logo +
              Sign In + Sign Up at 320px), so on mobile the toggle lives in
              the bottom-nav drawer instead (components/mobile-floating-nav.tsx). */}
          <ThemeToggle className="hidden md:inline-flex h-10 w-10" />
          {session ? (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" className="hidden sm:inline-flex px-3 lg:px-4">
                <Link href="/account">Account</Link>
              </Button>
              <Button variant="secondary" onClick={() => signOut()}>
                Logout
              </Button>
            </div>
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
