"use client";
import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Atom, FlaskConical, Leaf, PawPrint, Dna, Calculator,
  Languages, Brain, BookOpen, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSubtopics } from "@/lib/syllabus";
import type { ExamGroup } from "./page";

const SUBJECT_ICON: Record<string, React.ElementType> = {
  Physics: Atom,
  Chemistry: FlaskConical,
  Botany: Leaf,
  Zoology: PawPrint,
  Biology: Dna,
  Mathematics: Calculator,
  MAT: Brain,
  English: Languages,
};

const SUBJECT_ACCENT: Record<string, string> = {
  Physics: "text-blue-400 bg-blue-500/10 border-blue-400/20",
  Chemistry: "text-orange-400 bg-orange-500/10 border-orange-400/20",
  Botany: "text-green-400 bg-green-500/10 border-green-400/20",
  Zoology: "text-amber-400 bg-amber-500/10 border-amber-400/20",
  Biology: "text-teal-400 bg-teal-500/10 border-teal-400/20",
  Mathematics: "text-purple-400 bg-purple-500/10 border-purple-400/20",
  MAT: "text-pink-400 bg-pink-500/10 border-pink-400/20",
  English: "text-cyan-400 bg-cyan-500/10 border-cyan-400/20",
};

export function PracticeBrowser({ examGroups }: { examGroups: ExamGroup[] }) {
  const [filter, setFilter] = useState<string>(examGroups[0]?.exam ?? "ALL");

  const exams = filter === "ALL" ? examGroups : examGroups.filter((e) => e.exam === filter);
  const totalTopics = examGroups.reduce((s, e) => s + e.subjects.reduce((s2, sub) => s2 + sub.topics.length, 0), 0);
  const totalQuestions = examGroups.reduce((s, e) => s + e.subjects.reduce((s2, sub) => s2 + sub.total, 0), 0);

  return (
    <div className="container py-12 max-w-6xl">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-medium">Practice</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight">Practice by topic</h1>
          <p className="mt-2 text-muted-foreground text-sm max-w-xl">
            Structured around the official CEE and IOE entrance syllabi. No timer, no negative
            marking — pick a topic and drill it question by question with instant feedback.
          </p>
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> {totalTopics} syllabus topics</span>
            <span className="inline-flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> {totalQuestions} questions</span>
          </div>
        </div>
        {examGroups.length > 1 && (
          <div className="flex gap-1 p-1 rounded-lg border border-white/10 bg-white/[0.02] w-fit shrink-0">
            {["ALL", ...examGroups.map((e) => e.exam)].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-1.5 text-xs font-medium rounded-md transition",
                  filter === f ? "bg-white/[0.10] text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f === "ALL" ? "All" : f}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 space-y-12">
        {exams.map((group) => (
          <div key={group.exam}>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{group.exam}</h2>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>

            <div className="space-y-8">
              {group.subjects.map((s) => {
                const Icon = SUBJECT_ICON[s.subject] ?? Layers;
                const accent = SUBJECT_ACCENT[s.subject] ?? "text-cyan-400 bg-cyan-500/10 border-cyan-400/20";
                return (
                  <Card key={s.subject} className="p-6 glass-hover">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <span className={cn("h-11 w-11 rounded-xl border inline-flex items-center justify-center shrink-0", accent)}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold">{s.subject}</h3>
                          <p className="text-xs text-muted-foreground">{s.topics.length} topics · {s.total} questions</p>
                        </div>
                      </div>
                      <Button asChild variant="secondary" size="sm">
                        <Link href={`/practice/run?exam=${encodeURIComponent(group.exam)}&subject=${encodeURIComponent(s.subject)}`}>
                          Practice all {s.subject} <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>

                    <div className="mt-5 grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {s.topics.map((t) => {
                        const subtopics = getSubtopics(group.exam, s.subject, t.topic);
                        const shown = subtopics.slice(0, 3);
                        const extra = subtopics.length - shown.length;
                        return (
                          <Link
                            key={t.topic}
                            href={`/practice/run?exam=${encodeURIComponent(group.exam)}&subject=${encodeURIComponent(s.subject)}&topic=${encodeURIComponent(t.topic)}`}
                            className="group flex flex-col rounded-xl border border-white/[0.07] bg-white/[0.015] p-4 hover:border-cyan-400/40 hover:bg-cyan-500/[0.04] transition"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-medium leading-snug">{t.topic}</h4>
                              <span className="shrink-0 text-[10px] font-mono text-muted-foreground bg-white/[0.05] rounded-full px-2 py-0.5">{t.count}</span>
                            </div>
                            {shown.length > 0 && (
                              <div className="mt-2.5 flex flex-wrap gap-1.5">
                                {shown.map((st) => (
                                  <span key={st} className="text-[10px] leading-none px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-muted-foreground">
                                    {st}
                                  </span>
                                ))}
                                {extra > 0 && (
                                  <span className="text-[10px] leading-none px-2 py-1 rounded-md text-muted-foreground/70">+{extra} more</span>
                                )}
                              </div>
                            )}
                            <span className="mt-3 inline-flex items-center gap-1 text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition">
                              Start practice <ArrowRight className="h-3 w-3" />
                            </span>
                          </Link>
                        );
                      })}
                    </div>
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
