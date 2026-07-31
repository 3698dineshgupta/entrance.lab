"use client";
import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronDown, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExamGroup } from "./page";

export function PracticeBrowser({ examGroups }: { examGroups: ExamGroup[] }) {
  const [filter, setFilter] = useState<string>(examGroups[0]?.exam ?? "ALL");
  const [openSubject, setOpenSubject] = useState<string | null>(null);

  const exams = filter === "ALL" ? examGroups : examGroups.filter((e) => e.exam === filter);

  return (
    <div className="container py-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-medium">Practice</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight">Practice by topic</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            No timer, no negative marking — pick a topic and drill it question by question with instant feedback.
          </p>
        </div>
        {examGroups.length > 1 && (
          <div className="flex gap-1 p-1 rounded-lg border border-white/10 bg-white/[0.02] w-fit">
            {["ALL", ...examGroups.map((e) => e.exam)].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-md transition",
                  filter === f ? "bg-white/[0.08] text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f === "ALL" ? "All" : f}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 space-y-8">
        {exams.map((group) => (
          <div key={group.exam}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">{group.exam}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.subjects.map((s) => {
                const key = `${group.exam}::${s.subject}`;
                const isOpen = openSubject === key;
                return (
                  <Card key={key} className="p-5 glass-hover flex flex-col">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold">{s.subject}</h3>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.total} Qs</span>
                    </div>

                    <Button asChild className="mt-4" variant="secondary">
                      <Link href={`/practice/run?exam=${encodeURIComponent(group.exam)}&subject=${encodeURIComponent(s.subject)}`}>
                        <Play className="h-4 w-4" /> Practice all {s.subject}
                      </Link>
                    </Button>

                    <button
                      onClick={() => setOpenSubject(isOpen ? null : key)}
                      className="mt-3 flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition"
                    >
                      <span className="inline-flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> {s.topics.length} topics</span>
                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
                    </button>

                    {isOpen && (
                      <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-1.5">
                        {s.topics.map((t) => (
                          <Link
                            key={t.topic}
                            href={`/practice/run?exam=${encodeURIComponent(group.exam)}&subject=${encodeURIComponent(s.subject)}&topic=${encodeURIComponent(t.topic)}`}
                            className="flex items-center justify-between px-3 py-2 rounded-lg text-sm border border-white/[0.06] hover:border-cyan-400/40 hover:bg-cyan-500/[0.04] transition"
                          >
                            <span>{t.topic}</span>
                            <span className="text-xs text-muted-foreground">{t.count}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {exams.length === 0 && (
        <div className="mt-10 text-center py-16 rounded-2xl border border-dashed border-white/10">
          <p className="text-sm text-muted-foreground">No practice questions available yet.</p>
        </div>
      )}
    </div>
  );
}
