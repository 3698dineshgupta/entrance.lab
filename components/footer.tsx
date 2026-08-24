import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const resources = [
    { href: "/mock-tests", label: "Mock Tests" },
    { href: "/practice", label: "Practice" },
    { href: "/analytics", label: "Analytics" },
    { href: "/merchandise", label: "Merchandise" },
    { href: "/request-hub", label: "Request Hub" },
  ];
  const platform = [
    { href: "/register", label: "Sign Up" },
    { href: "/login", label: "Login" },
  ];
  const legal = [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ];

  return (
    <footer className="relative mt-16 overflow-hidden border-t border-slate-200 bg-slate-50/60 dark:border-white/[0.06] dark:bg-[#0B1024]/60">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#4F6BFF]/50 via-50% to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-[#4F6BFF]/[0.05] blur-3xl dark:bg-[#8B5CF6]/[0.08]"
        aria-hidden="true"
      />
      <div className="container grid gap-10 py-10 md:grid-cols-4 md:py-14">
        {/* Brand */}
        <div>
          <Link href="/" className="group flex items-center gap-2 w-fit">
            <span className="relative inline-flex h-9 w-9 shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
              <Image src="/brain-logo-mark.png" alt="EntranceLab" fill sizes="36px" className="object-contain" />
            </span>
            <span className="font-heading text-lg font-semibold tracking-tight">
              Entrance<span className="text-blue-600 dark:text-[#8FB4FF]">Lab</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Free &amp; premium mock tests for IOE Engineering and CEE Medical entrance aspirants in Nepal. Realistic questions, instant analytics, and honest explanations.
          </p>
        </div>

        <FooterCol title="Resources" links={resources} />
        <FooterCol title="Platform" links={platform} />
        <FooterCol title="Legal" links={legal} />
      </div>

      <div className="border-t border-slate-200 dark:border-white/[0.06]">
        <div className="container flex flex-col items-center justify-between gap-2 py-4 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} EntranceLab. All rights reserved.</p>
          <p>Made for Nepalese students</p>
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
              className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
            >
              {l.icon}
              <span className="relative">
                {l.label}
                <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-current transition-all duration-300 group-hover:w-full" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
