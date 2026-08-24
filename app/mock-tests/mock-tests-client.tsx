"use client";
import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Clock, ListChecks, Play, Atom, FlaskConical, Sigma, BookText,
  Leaf, PawPrint, Brain, Layers, Trophy, LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TestSetSummary = {
  id: string;
  title: string;
  exam: string;
  mode: string;
  difficulty: string;
  subject: string | null;
  durationMinutes: number;
  _count: { questions: number };
};

interface Colorway {
  topBar: string;
  chip: string;
  iconWrap: string;
  iconText: string;
  glow: string;
  button: string;
}

// Fully static class strings (no interpolated color values) so Tailwind's
// content scanner can actually see and keep them — a dynamically built
// class name like `from-${hex}` would silently get purged from the build.
const SUBJECT_COLORWAY: Record<string, Colorway & { Icon: LucideIcon }> = {
  Physics: {
    Icon: Atom,
    topBar: "from-blue-500 to-cyan-400",
    chip: "border-blue-400/25 bg-blue-500/[0.08] text-blue-700 dark:text-blue-300",
    iconWrap: "from-blue-500/20 to-cyan-400/10 border-blue-400/25",
    iconText: "text-blue-600 dark:text-blue-300",
    glow: "from-blue-500/25 to-cyan-400/10",
    button: "from-blue-500 to-cyan-500 shadow-blue-500/25 hover:shadow-blue-500/40",
  },
  Chemistry: {
    Icon: FlaskConical,
    topBar: "from-violet-500 to-fuchsia-400",
    chip: "border-violet-400/25 bg-violet-500/[0.08] text-violet-700 dark:text-violet-300",
    iconWrap: "from-violet-500/20 to-fuchsia-400/10 border-violet-400/25",
    iconText: "text-violet-600 dark:text-violet-300",
    glow: "from-violet-500/25 to-fuchsia-400/10",
    button: "from-violet-500 to-fuchsia-500 shadow-violet-500/25 hover:shadow-violet-500/40",
  },
  Mathematics: {
    Icon: Sigma,
    topBar: "from-indigo-500 to-blue-400",
    chip: "border-indigo-400/25 bg-indigo-500/[0.08] text-indigo-700 dark:text-indigo-300",
    iconWrap: "from-indigo-500/20 to-blue-400/10 border-indigo-400/25",
    iconText: "text-indigo-600 dark:text-indigo-300",
    glow: "from-indigo-500/25 to-blue-400/10",
    button: "from-indigo-500 to-blue-500 shadow-indigo-500/25 hover:shadow-indigo-500/40",
  },
  English: {
    Icon: BookText,
    topBar: "from-rose-500 to-pink-400",
    chip: "border-rose-400/25 bg-rose-500/[0.08] text-rose-700 dark:text-rose-300",
    iconWrap: "from-rose-500/20 to-pink-400/10 border-rose-400/25",
    iconText: "text-rose-600 dark:text-rose-300",
    glow: "from-rose-500/25 to-pink-400/10",
    button: "from-rose-500 to-pink-500 shadow-rose-500/25 hover:shadow-rose-500/40",
  },
  Botany: {
    Icon: Leaf,
    topBar: "from-emerald-500 to-teal-400",
    chip: "border-emerald-400/25 bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-300",
    iconWrap: "from-emerald-500/20 to-teal-400/10 border-emerald-400/25",
    iconText: "text-emerald-600 dark:text-emerald-300",
    glow: "from-emerald-500/25 to-teal-400/10",
    button: "from-emerald-500 to-teal-500 shadow-emerald-500/25 hover:shadow-emerald-500/40",
  },
  Zoology: {
    Icon: PawPrint,
    topBar: "from-amber-500 to-orange-400",
    chip: "border-amber-400/25 bg-amber-500/[0.08] text-amber-700 dark:text-amber-300",
    iconWrap: "from-amber-500/20 to-orange-400/10 border-amber-400/25",
    iconText: "text-amber-600 dark:text-amber-300",
    glow: "from-amber-500/25 to-orange-400/10",
    button: "from-amber-500 to-orange-500 shadow-amber-500/25 hover:shadow-amber-500/40",
  },
  MAT: {
    Icon: Brain,
    topBar: "from-cyan-500 to-sky-400",
    chip: "border-cyan-400/25 bg-cyan-500/[0.08] text-cyan-700 dark:text-cyan-300",
    iconWrap: "from-cyan-500/20 to-sky-400/10 border-cyan-400/25",
    iconText: "text-cyan-600 dark:text-cyan-300",
    glow: "from-cyan-500/25 to-sky-400/10",
    button: "from-cyan-500 to-sky-500 shadow-cyan-500/25 hover:shadow-cyan-500/40",
  },
};

// Full/mixed tests have no single subject — cycle through a couple of
// on-brand variants per exam so a page of "CEE Full Mock Test" cards still
// reads as distinct entries rather than one card repeated.
const EXAM_FALLBACK: Record<string, (Colorway & { Icon: LucideIcon })[]> = {
  IOE: [
    { Icon: Atom, topBar: "from-[#4F6BFF] to-[#3DD9FF]", chip: "border-[#4F6BFF]/25 bg-[#4F6BFF]/[0.08] text-blue-700 dark:text-[#8FB4FF]", iconWrap: "from-[#4F6BFF]/20 to-[#3DD9FF]/10 border-[#4F6BFF]/25", iconText: "text-blue-600 dark:text-[#8FB4FF]", glow: "from-[#4F6BFF]/25 to-[#3DD9FF]/10", button: "from-[#4F6BFF] to-[#3DD9FF] shadow-[#4F6BFF]/25 hover:shadow-[#4F6BFF]/40" },
    { Icon: Layers, topBar: "from-indigo-500 to-[#4F6BFF]", chip: "border-indigo-400/25 bg-indigo-500/[0.08] text-indigo-700 dark:text-indigo-300", iconWrap: "from-indigo-500/20 to-[#4F6BFF]/10 border-indigo-400/25", iconText: "text-indigo-600 dark:text-indigo-300", glow: "from-indigo-500/25 to-[#4F6BFF]/10", button: "from-indigo-500 to-[#4F6BFF] shadow-indigo-500/25 hover:shadow-indigo-500/40" },
  ],
  CEE: [
    { Icon: Trophy, topBar: "from-orange-500 to-pink-500", chip: "border-orange-400/25 bg-orange-500/[0.08] text-orange-700 dark:text-orange-300", iconWrap: "from-orange-500/20 to-pink-500/10 border-orange-400/25", iconText: "text-orange-600 dark:text-orange-300", glow: "from-orange-500/25 to-pink-500/10", button: "from-orange-500 to-pink-500 shadow-orange-500/25 hover:shadow-orange-500/40" },
    { Icon: Layers, topBar: "from-rose-500 to-orange-400", chip: "border-rose-400/25 bg-rose-500/[0.08] text-rose-700 dark:text-rose-300", iconWrap: "from-rose-500/20 to-orange-400/10 border-rose-400/25", iconText: "text-rose-600 dark:text-rose-300", glow: "from-rose-500/25 to-orange-400/10", button: "from-rose-500 to-orange-400 shadow-rose-500/25 hover:shadow-rose-500/40" },
  ],
};

function getColorway(t: TestSetSummary, index: number): Colorway & { Icon: LucideIcon } {
  if (t.subject && SUBJECT_COLORWAY[t.subject]) return SUBJECT_COLORWAY[t.subject];
  const fallbacks = EXAM_FALLBACK[t.exam] ?? EXAM_FALLBACK.IOE;
  return fallbacks[index % fallbacks.length];
}

export function MockTestsClient({ initialTests }: { initialTests: TestSetSummary[] }) {
  const [filter, setFilter] = useState<string>("ALL");
  const tests = filter === "ALL" ? initialTests : initialTests.filter((t) => t.exam === filter);

  return (
    <div className="container py-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-400 font-medium">Mock tests</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight">Choose a test to begin</h1>
          <p className="mt-2 text-muted-foreground text-sm">Full mock tests and subject-wise practice sets for IOE and CEE.</p>
        </div>
        <div className="flex gap-1 p-1 rounded-lg border border-slate-200 bg-slate-900/[0.02] dark:border-white/10 dark:bg-white/[0.02] w-fit">
          {(["ALL", "IOE", "CEE"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-md transition",
                filter === f ? "bg-white shadow-sm text-foreground dark:bg-white/[0.08] dark:shadow-none" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f === "ALL" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {tests.map((t, i) => {
          const c = getColorway(t, i);
          return (
            <Card key={t.id} className="group relative overflow-hidden p-5 glass-hover flex flex-col transition-shadow duration-300 hover:shadow-xl">
              <div className={cn("absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r", c.topBar)} aria-hidden="true" />
              <c.Icon
                className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 text-slate-900/[0.03] dark:text-white/[0.04] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
                aria-hidden="true"
                strokeWidth={1}
              />
              <div
                className={cn("pointer-events-none absolute -top-14 -right-14 h-36 w-36 rounded-full bg-gradient-to-br opacity-60 blur-3xl transition-transform duration-500 group-hover:scale-125", c.glow)}
                aria-hidden="true"
              />

              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={cn("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-gradient-to-br", c.iconWrap, c.iconText)}>
                    <c.Icon className="h-4 w-4" />
                  </span>
                  <span className={cn("text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md border", c.chip)}>
                    {t.exam} · {t.mode}
                  </span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.difficulty}</span>
              </div>

              <h3 className="relative mt-4 text-base font-semibold">{t.title}</h3>
              {t.subject && <p className="relative text-xs text-muted-foreground mt-1">Subject: {t.subject}</p>}

              <div className="relative mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><ListChecks className="h-3.5 w-3.5" /> {t._count.questions} Qs</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {t.durationMinutes} min</span>
              </div>
              <div className="relative mt-5 flex-1" />
              <Link
                href={`/test/${t.id}`}
                className={cn(
                  "btn-shine relative mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r px-4 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:brightness-110",
                  c.button
                )}
              >
                <Play className="h-4 w-4" /> Start Test
              </Link>
            </Card>
          );
        })}
      </div>

      {tests.length === 0 && (
        <div className="mt-10 text-center py-16 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
          <p className="text-sm text-muted-foreground">No tests available yet for this filter.</p>
        </div>
      )}
    </div>
  );
}
