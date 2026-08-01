"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight, CheckCircle2 } from "lucide-react";
import { getSubtopicIcon, getSubjectIcon } from "@/lib/subject-style";
import { cn } from "@/lib/utils";

export interface SubtopicCardData {
  key: string;
  topic: string;
  label: string;
  unitLabel: string;
  count: number;
  answered: number;
  done: boolean;
  href: string;
}

export interface UnitSectionData {
  topic: string;
  unitNumber: number;
  cards: SubtopicCardData[];
}

interface Props {
  sections: UnitSectionData[];
  subject: string;
}

export function SubtopicBrowser({ sections, subject }: Props) {
  const subjectIcon = getSubjectIcon(subject);
  const [query, setQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sections
      .filter((s) => !activeTopic || s.topic === activeTopic)
      .map((s) => ({
        ...s,
        cards: s.cards.filter(
          (c) => !q || c.label.toLowerCase().includes(q) || c.topic.toLowerCase().includes(q)
        ),
      }))
      .filter((s) => s.cards.length > 0);
  }, [sections, query, activeTopic]);

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chapter or topic..."
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-cyan-400/40 focus:border-cyan-400/40 transition"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTopic(null)}
            className={cn(
              "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
              activeTopic === null
                ? "bg-cyan-500/15 border-cyan-400/40 text-cyan-300"
                : "border-white/[0.08] text-muted-foreground hover:border-white/20 hover:text-foreground"
            )}
          >
            All
          </button>
          {sections.map((s) => (
            <button
              key={s.topic}
              onClick={() => setActiveTopic(s.topic)}
              className={cn(
                "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
                activeTopic === s.topic
                  ? "bg-cyan-500/15 border-cyan-400/40 text-cyan-300"
                  : "border-white/[0.08] text-muted-foreground hover:border-white/20 hover:text-foreground"
              )}
            >
              {s.topic}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-16">No topics match "{query}".</p>
      )}

      <div className="space-y-9 mt-8">
        {filtered.map((s) => (
          <div key={s.topic}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xs font-semibold tracking-[0.15em] text-cyan-300/90 whitespace-nowrap">
                UNIT {s.unitNumber} — {s.topic.toUpperCase()}
              </h2>
              <div className="h-px flex-1 bg-white/[0.08]" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {s.cards.map((c) => {
                const Icon = getSubtopicIcon(c.label, subjectIcon);
                return (
                  <Link
                    key={c.key}
                    href={c.href}
                    className={cn(
                      "group relative flex flex-col gap-3 rounded-2xl border p-4 transition",
                      c.done
                        ? "border-green-400/25 bg-green-500/[0.04] hover:border-green-400/50"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-cyan-400/40 hover:bg-cyan-500/[0.04]"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={cn(
                          "h-10 w-10 rounded-xl inline-flex items-center justify-center border",
                          c.done
                            ? "bg-green-500/10 border-green-400/25 text-green-400"
                            : "bg-cyan-500/10 border-cyan-400/20 text-cyan-300"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-[11px] font-mono px-2 py-1 rounded-full bg-white/[0.05] border border-white/[0.07] text-muted-foreground">
                        {c.unitLabel}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-semibold leading-snug flex items-start gap-1.5">
                        {c.done && <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0 mt-0.5" />}
                        <span>{c.label}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {c.answered > 0 ? `${c.answered}/${c.count} answered` : `${c.count} questions`}
                      </p>
                    </div>

                    {c.answered > 0 && (
                      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className={cn("h-full", c.done ? "bg-green-400" : "bg-cyan-400")}
                          style={{ width: `${Math.min(100, Math.round((c.answered / c.count) * 100))}%` }}
                        />
                      </div>
                    )}

                    <div className="mt-auto pt-1 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-muted-foreground truncate max-w-[65%]">
                        {c.topic}
                      </span>
                      <span
                        className={cn(
                          "h-7 w-7 rounded-full inline-flex items-center justify-center border shrink-0 transition",
                          "border-white/[0.1] text-muted-foreground group-hover:border-cyan-400/50 group-hover:text-cyan-300 group-hover:bg-cyan-500/10"
                        )}
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
