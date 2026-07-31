"use client";
import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ListChecks, Play } from "lucide-react";
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

export function MockTestsClient({ initialTests }: { initialTests: TestSetSummary[] }) {
  const [filter, setFilter] = useState<string>("ALL");
  const tests = filter === "ALL" ? initialTests : initialTests.filter((t) => t.exam === filter);

  return (
    <div className="container py-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-medium">Mock tests</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight">Choose a test to begin</h1>
          <p className="mt-2 text-muted-foreground text-sm">Full mock tests and subject-wise practice sets for IOE and CEE.</p>
        </div>
        <div className="flex gap-1 p-1 rounded-lg border border-white/10 bg-white/[0.02] w-fit">
          {(["ALL", "IOE", "CEE"] as const).map((f) => (
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
      </div>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tests.map((t) => (
          <Card key={t.id} className="p-5 glass-hover flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-md border border-white/10 bg-white/[0.02]">
                {t.exam} · {t.mode}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.difficulty}</span>
            </div>
            <h3 className="mt-3 text-base font-semibold">{t.title}</h3>
            {t.subject && <p className="text-xs text-muted-foreground mt-1">Subject: {t.subject}</p>}
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><ListChecks className="h-3.5 w-3.5" /> {t._count.questions} Qs</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {t.durationMinutes} min</span>
            </div>
            <div className="mt-5 flex-1" />
            <Button asChild className="mt-4">
              <Link href={`/test/${t.id}`}><Play className="h-4 w-4" /> Start Test</Link>
            </Button>
          </Card>
        ))}
      </div>

      {tests.length === 0 && (
        <div className="mt-10 text-center py-16 rounded-2xl border border-dashed border-white/10">
          <p className="text-sm text-muted-foreground">No tests available yet for this filter.</p>
        </div>
      )}
    </div>
  );
}
