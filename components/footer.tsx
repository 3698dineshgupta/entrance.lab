import Link from "next/link";
import { GraduationCap, Bug } from "lucide-react";

export function Footer() {
  const resources = [
    { href: "/mock-tests", label: "Mock Tests" },
    { href: "/request-hub", label: "Request Hub" },
  ];
  const platform = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/signup", label: "Sign Up" },
    { href: "/login", label: "Login" },
  ];
  const legal = [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ];

  return (
    <footer className="border-t border-white/[0.06] mt-16 bg-black/20">
      <div className="container py-10 md:py-14 grid gap-10 md:grid-cols-4">
        {/* Brand */}
        <div>
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/20">
              <GraduationCap className="h-5 w-5 text-white" />
            </span>
            <span className="font-semibold tracking-tight text-lg">
              Entrance<span className="text-blue-400">Lab</span>
            </span>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xs">
            Free &amp; premium mock tests for IOE Engineering and CEE Medical entrance aspirants in Nepal. Realistic questions, instant analytics, and honest explanations.
          </p>
        </div>

        <FooterCol title="Resources" links={resources} />
        <FooterCol title="Platform" links={platform} />
        <FooterCol title="Legal" links={legal} />
      </div>

      <div className="border-t border-white/[0.06]">
        <div className="container py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} EntranceLab. All rights reserved.</p>
          <p>Made for Nepalese students · <Link href="/contact" className="hover:text-foreground transition">Contact</Link></p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string; icon?: React.ReactNode }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm text-muted-foreground hover:text-foreground transition inline-flex items-center gap-1.5"
            >
              {l.icon}
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
