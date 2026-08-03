"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, GraduationCap, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  const links = [
    { href: "/", label: "Home" },
    { href: "/mock-tests", label: "Mock Tests" },
    { href: "/practice", label: "Practice" },
    { href: "/merchandise", label: "Merchandise" },
    { href: "/analytics", label: "Analytics" },
  ];

  if (session?.user?.role === "ADMIN") {
    links.push({ href: "/admin", label: "Admin Panel" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/20">
            <GraduationCap className="h-5 w-5 text-white" />
          </span>
          <span className="font-semibold tracking-tight text-lg">
            Entrance<span className="text-blue-400">Lab</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition rounded-md"
            >
              {l.label}
            </Link>
          ))}
          {session ? (
            <Button size="sm" variant="secondary" className="ml-2" onClick={() => signOut()}>
              Logout
            </Button>
          ) : (
            <Button asChild size="sm" className="ml-2">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </nav>

        <button
          className="md:hidden p-2 rounded-md hover:bg-white/5"
          aria-label={session ? "Logout" : "Toggle menu"}
          onClick={() => (session ? signOut() : setOpen((v) => !v))}
        >
          {session ? (
            <LogOut className="h-5 w-5" />
          ) : open ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {!session && (
        <div
          className={cn(
            "md:hidden overflow-hidden border-t border-white/[0.06] transition-[max-height]",
            open ? "max-h-64" : "max-h-0"
          )}
        >
          <div className="container py-3 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-md hover:bg-white/[0.04] text-sm"
              >
                {l.label}
              </Link>
            ))}
            <Button asChild size="sm" className="mt-2">
              <Link href="/login" onClick={() => setOpen(false)}>Login</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
