"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EXAMS, MOCK_TESTS } from "@/lib/questions";
import { ExamType, TestMode, Difficulty } from "@/lib/types";
import { cn } from "@/lib/utils";

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
          <DialogTitle>Choose your exam</DialogTitle>
          <DialogDescription>Pick an examination, mode, and difficulty to begin.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Examination</p>
            <div className="grid grid-cols-2 gap-2">
              {EXAMS.map((e) => (
                <button
                  key={e.id}
                  onClick={() => { setExam(e.id); setSubject(undefined); }}
                  className={cn(
                    "text-left rounded-xl border p-3 transition",
                    exam === e.id
                      ? "border-blue-400/50 bg-blue-500/10"
                      : "border-white/10 hover:border-white/20 bg-white/[0.02]"
                  )}
                >
                  <p className="text-sm font-medium">{e.id}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{e.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Mode</p>
            <div className="grid grid-cols-2 gap-2">
              {(["full", "subject"] as TestMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm capitalize transition",
                    mode === m
                      ? "border-blue-400/50 bg-blue-500/10"
                      : "border-white/10 hover:border-white/20 bg-white/[0.02]"
                  )}
                >
                  {m === "full" ? "Full mock test" : "Subject-wise"}
                </button>
              ))}
            </div>
          </div>

          {mode === "subject" && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Subject</p>
              <div className="flex flex-wrap gap-2">
                {meta.subjects.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSubject(s)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs transition",
                      subject === s
                        ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-100"
                        : "border-white/10 hover:border-white/20"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Difficulty</p>
            <div className="grid grid-cols-4 gap-2">
              {(["easy", "medium", "hard", "mixed"] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    "rounded-lg border px-2 py-1.5 text-xs capitalize transition",
                    difficulty === d
                      ? "border-purple-400/50 bg-purple-500/10"
                      : "border-white/10 hover:border-white/20"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={start} disabled={!canStart}>Start Mock Test</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
