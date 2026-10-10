"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EXAMS, MOCK_TESTS } from "@/lib/questions";
import { ExamType, TestMode, Difficulty } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GraduationCap, Check, ListChecks, Layers } from "lucide-react";

const DIFFICULTY_STYLE: Record<Difficulty, string> = {
  easy: "from-emerald-500 to-teal-400 shadow-emerald-500/30",
  medium: "from-amber-500 to-orange-400 shadow-amber-500/30",
  hard: "from-rose-500 to-red-500 shadow-rose-500/30",
  mixed: "from-[#8B5CF6] to-[#4F6BFF] shadow-[#8B5CF6]/30",
};

export function ExamSelectionModal({
  open,
  onOpenChange,
  defaultExam,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultExam?: ExamType;
}) {
  const router = useRouter();
  const [exam, setExam] = useState<ExamType>(defaultExam ?? "IOE");
  const [mode, setMode] = useState<TestMode>("full");
  const [subject, setSubject] = useState<string | undefined>();
  const [difficulty, setDifficulty] = useState<Difficulty>("mixed");

  const meta = EXAMS.find((e) => e.id === exam)!;

  const matchedTest = useMemo(() => {
    return MOCK_TESTS.find(
      (t) => t.exam === exam && t.mode === mode && (mode === "full" || t.subject === subject)
    );
  }, [exam, mode, subject]);

  const canStart = mode === "full" || (mode === "subject" && subject);

  const start = () => {
    if (matchedTest) {
      router.push(`/test/${matchedTest.id}`);
    } else {
      // fallback: any test of that exam
      const fb = MOCK_TESTS.find((t) => t.exam === exam);
      if (fb) router.push(`/test/${fb.id}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-xl">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F6BFF] to-[#8B5CF6] text-white shadow-md shadow-[#4F6BFF]/30">
              <GraduationCap className="h-4 w-4" />
            </span>
            Choose your exam
          </DialogTitle>
          <DialogDescription>Pick an examination, mode, and difficulty to begin.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2 font-medium">Examination</p>
            <div className="grid grid-cols-2 gap-2.5">
              {EXAMS.map((e) => {
                const active = exam === e.id;
                return (
                  <button
                    key={e.id}
                    onClick={() => { setExam(e.id); setSubject(undefined); }}
                    className={cn(
                      "relative text-left rounded-xl border p-3.5 transition-all duration-200",
                      active
                        ? "border-transparent bg-gradient-to-br from-[#4F6BFF] to-[#8B5CF6] text-white shadow-lg shadow-[#4F6BFF]/25"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-900/[0.03] bg-slate-900/[0.015] dark:border-white/10 dark:hover:border-white/20 dark:bg-white/[0.02]"
                    )}
                  >
                    {active && (
                      <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/20">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    )}
                    <p className="text-sm font-semibold">{e.id}</p>
                    <p className={cn("text-xs line-clamp-1 mt-0.5", active ? "text-white/80" : "text-muted-foreground")}>
                      {e.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2 font-medium">Mode</p>
            <div className="grid grid-cols-2 gap-2.5">
              {(["full", "subject"] as TestMode[]).map((m) => {
                const active = mode === m;
                const Icon = m === "full" ? ListChecks : Layers;
                return (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      active
                        ? "border-transparent bg-gradient-to-br from-[#4F6BFF] to-[#8B5CF6] text-white shadow-lg shadow-[#4F6BFF]/25"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-900/[0.03] bg-slate-900/[0.015] dark:border-white/10 dark:hover:border-white/20 dark:bg-white/[0.02]"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {m === "full" ? "Full mock test" : "Subject-wise"}
                  </button>
                );
              })}
            </div>
          </div>

          {mode === "subject" && (
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2 font-medium">Subject</p>
              <div className="flex flex-wrap gap-2">
                {meta.subjects.map((s) => {
                  const active = subject === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setSubject(s)}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
                        active
                          ? "border-transparent bg-gradient-to-r from-[#3DD9FF] to-[#4F6BFF] text-white shadow-md shadow-[#3DD9FF]/25"
                          : "border-slate-200 hover:border-slate-300 bg-slate-900/[0.015] dark:border-white/10 dark:hover:border-white/20 dark:bg-white/[0.02]"
                      )}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2 font-medium">Difficulty</p>
            <div className="grid grid-cols-4 gap-2">
              {(["easy", "medium", "hard", "mixed"] as Difficulty[]).map((d) => {
                const active = difficulty === d;
                return (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-xs font-medium capitalize transition-all duration-200",
                      active
                        ? cn("border-transparent bg-gradient-to-br text-white shadow-md", DIFFICULTY_STYLE[d])
                        : "border-slate-200 hover:border-slate-300 bg-slate-900/[0.015] dark:border-white/10 dark:hover:border-white/20 dark:bg-white/[0.02]"
                    )}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={start}
            disabled={!canStart}
            className="btn-shine bg-gradient-to-r from-[#4F6BFF] to-[#8B5CF6] shadow-lg shadow-[#4F6BFF]/25 hover:brightness-110 disabled:opacity-40 disabled:shadow-none"
          >
            Start Mock Test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
