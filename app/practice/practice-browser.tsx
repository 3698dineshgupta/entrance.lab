"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowRight, BookOpen, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSubjectIcon, getSubjectColor, getSubjectImage } from "@/lib/subject-style";
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
                const image = getSubjectImage(s.subject, group.exam);
                const Icon = getSubjectIcon(s.subject);
                const color = getSubjectColor(s.subject);
                return (
                  <Link
                    key={s.subject}
                    href={`/practice/${encodeURIComponent(group.exam)}/${encodeURIComponent(s.subject)}`}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border transition-all",
                      "hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/20",
                      image ? "border-white/10 aspect-[2.5/1]" : cn("bg-gradient-to-br aspect-[4/1]", color.from, color.to, color.ring)
                    )}
                  >
                    {image ? (
                      <>
                        <Image
                          src={image}
                          alt={s.subject}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
                          priority={false}
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-white/70 backdrop-blur-sm rounded-full px-6 py-2 border border-white/40 shadow-sm">
                            <h3 className="text-xl md:text-2xl font-serif font-bold text-slate-800 uppercase tracking-widest">
                              {s.subject}
                            </h3>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="relative h-full flex items-center gap-3 px-4">
                        <Icon className={cn(
                          "absolute -right-3 -bottom-3 h-20 w-20 opacity-[0.08] group-hover:opacity-[0.14] group-hover:scale-105 transition-all duration-300",
                          color.text
                        )} />
                        <span className={cn("h-9 w-9 shrink-0 rounded-lg bg-background/40 backdrop-blur border inline-flex items-center justify-center", color.ring)}>
                          <Icon className={cn("h-4 w-4", color.text)} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold tracking-tight truncate">{s.subject}</h3>
                          <p className="text-[11px] text-muted-foreground">{s.topics.length} topics · {s.total} questions</p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    )}
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
