"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookOpen, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSubjectIcon, getSubjectColor } from "@/lib/subject-style";
import type { ExamGroup } from "@/lib/practice-data";

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
            marking — pick a subject, drill into a topic or subtopic, and get instant feedback.
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

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {group.subjects.map((s) => {
                const Icon = getSubjectIcon(s.subject);
                const color = getSubjectColor(s.subject);
                return (
                  <Link
                    key={s.subject}
                    href={`/practice/${encodeURIComponent(group.exam)}/${encodeURIComponent(s.subject)}`}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 h-44 flex flex-col justify-between transition-all",
                      "hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20",
                      color.from, color.to, color.ring
                    )}
                  >
                    <Icon className={cn(
                      "absolute -right-4 -bottom-4 h-32 w-32 opacity-[0.08] group-hover:opacity-[0.14] group-hover:scale-105 transition-all duration-300",
                      color.text
                    )} />

                    <div className="relative flex items-start justify-between">
                      <span className={cn("h-11 w-11 rounded-xl bg-background/40 backdrop-blur border inline-flex items-center justify-center", color.ring)}>
                        <Icon className={cn("h-5 w-5", color.text)} />
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </div>

                    <div className="relative">
                      <h3 className="text-xl font-semibold tracking-tight">{s.subject}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{s.topics.length} topics · {s.total} questions</p>
                    </div>
                  </Link>
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
