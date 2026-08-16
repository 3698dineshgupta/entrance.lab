"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MockTest } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { formatTime, cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Flag, Save, Timer, AlertTriangle, Menu, BookOpen, Loader2 } from "lucide-react";

interface Props { test: MockTest; }

type Answers = Record<string, number | null>;
type Marked = Record<string, boolean>;

export function TestInterface({ test }: Props) {
  const router = useRouter();
  const total = test.questions.length;
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>(() =>
    Object.fromEntries(test.questions.map((q) => [q.id, null]))
  );
  const [marked, setMarked] = useState<Marked>({});
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [remaining, setRemaining] = useState(test.durationMinutes * 60);
  const startedAt = useRef(Date.now());
  const isSubmitting = useRef(false); // prevent double-submit
  // per-subject time tracking
  const subjectTimes = useRef<Record<string, number>>({});
  const lastSubjectSwitch = useRef<{ subject: string; ts: number } | null>(null);
  // Stable ref to submit so the timer interval never captures a stale closure
  const submitRef = useRef<() => void>(() => {});

  const current = test.questions[idx];
  const answeredCount = Object.values(answers).filter((v) => v !== null).length;
  const progress = (answeredCount / total) * 100;

  // unique subjects in order
  const subjects = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const q of test.questions) {
      if (!seen.has(q.subject)) { seen.add(q.subject); out.push(q.subject); }
    }
    return out;
  }, [test.questions]);

  // index of first question for each subject
  const subjectStartIndex = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = 0; i < test.questions.length; i++) {
      if (!(test.questions[i].subject in map)) map[test.questions[i].subject] = i;
    }
    return map;
  }, [test.questions]);

  // track time per subject when question changes
  useEffect(() => {
    const currentSubj = current.subject;
    if (lastSubjectSwitch.current) {
      const { subject, ts } = lastSubjectSwitch.current;
      const elapsed = (Date.now() - ts) / 1000;
      subjectTimes.current[subject] = (subjectTimes.current[subject] ?? 0) + elapsed;
    }
    lastSubjectSwitch.current = { subject: currentSubj, ts: Date.now() };
  }, [current.subject]);

  // timer — uses submitRef so auto-submit never fires a stale closure
  useEffect(() => {
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(t); submitRef.current(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []); // intentionally empty deps — submitRef is always current

  // warn before leave
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIdx((i) => Math.min(total - 1, i + 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      if (["1", "2", "3", "4"].includes(e.key)) {
        const n = parseInt(e.key) - 1;
        setAnswers((a) => ({ ...a, [current.id]: n }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current.id, total]);

  const submit = async () => {
    // Guard against double-submit (e.g., button spam or timer firing simultaneously)
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setSubmitting(true);
    setShowSubmit(true);

    // flush remaining subject time
    if (lastSubjectSwitch.current) {
      const { subject, ts } = lastSubjectSwitch.current;
      const elapsed = (Date.now() - ts) / 1000;
      subjectTimes.current[subject] = (subjectTimes.current[subject] ?? 0) + elapsed;
    }

    const now = Date.now();
    const attempt = {
      testId: test.id,
      startedAt: new Date(startedAt.current).toISOString(),
      submittedAt: new Date(now).toISOString(),
      durationSeconds: Math.round((now - startedAt.current) / 1000),
      answers,
      marked,
      subjectTimes: { ...subjectTimes.current },
    };

    // Compute summary locally for immediate results page display
    let correct = 0, incorrect = 0, unanswered = 0, score = 0;
    const bySubject: any = {};
    
    for (const q of test.questions) {
      bySubject[q.subject] ??= { correct: 0, incorrect: 0, total: 0, accuracy: 0 };
      bySubject[q.subject].total += 1;
      
      const a = answers[q.id];
      if (a === null || a === undefined) {
        unanswered += 1;
      } else if (a === q.correctIndex) {
        correct += 1;
        score += q.marks;
        bySubject[q.subject].correct += 1;
      } else {
        incorrect += 1;
        score -= q.negativeMarks ?? 0;
        bySubject[q.subject].incorrect += 1;
      }
    }

    for (const s of Object.values(bySubject)) {
      const attempted = (s as any).correct + (s as any).incorrect;
      (s as any).accuracy = attempted > 0 ? Math.round(((s as any).correct / attempted) * 100) : 0;
    }

    score = Math.round(score * 100) / 100;
    const maxScore = test.questions.reduce((s, q) => s + q.marks, 0);
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const accuracy = correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0;

    const summary = {
      testId: test.id,
      exam: test.exam,
      title: test.title,
      score,
      maxScore,
      percentage,
      accuracy,
      correct,
      incorrect,
      unanswered,
      durationSeconds: attempt.durationSeconds,
      bySubject,
      answers,
      questions: test.questions,
    };

    try { sessionStorage.setItem("lastAttempt", JSON.stringify(summary)); } catch {}

    // Save to Postgres via API
    try {
      await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attempt),
      });
    } catch (e) {
      console.error("Failed to save attempt to DB:", e);
    }

    router.push("/results");
  };

  // Keep submitRef in sync so the timer always calls the latest version
  // This runs every render but is just a ref assignment — essentially free
  submitRef.current = submit;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Test header — no global navbar on this route (see components/app-chrome.tsx), so this owns the full top of the viewport for a distraction-free, thumb-friendly layout */}
      <div className="border-b border-slate-200 bg-background/80 backdrop-blur-xl sticky top-0 z-30 dark:border-white/[0.06]">
        <div className="container py-3 flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{test.exam} · {test.mode}</p>
            <h2 className="text-sm md:text-base font-semibold truncate">{test.title}</h2>
          </div>
          <div className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-mono",
            remaining < 300 ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-300" : "border-slate-200 bg-slate-900/[0.02] dark:border-white/10 dark:bg-white/[0.03]"
          )}>
            <Timer className="h-4 w-4" />
            {formatTime(remaining)}
          </div>
          <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setShowNav(true)}>
            <Menu className="h-4 w-4" /> {idx + 1}/{total}
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setShowSubmit(true)}>Submit</Button>
        </div>
        <div className="container pb-3">
          <Progress value={progress} />
        </div>

        {/* Subject tab bar (only when multiple subjects) */}
        {subjects.length > 1 && (
          <div className="container pb-2 flex gap-1 overflow-x-auto scrollbar-hide">
            {subjects.map((s) => {
              const isActive = current.subject === s;
              const subjectQs = test.questions.filter((q) => q.subject === s);
              const subjectAnswered = subjectQs.filter((q) => answers[q.id] !== null).length;
              return (
                <button
                  key={s}
                  onClick={() => setIdx(subjectStartIndex[s])}
                  className={cn(
                    "flex-shrink-0 px-3 py-1 text-xs rounded-full border transition-all",
                    isActive
                      ? "border-cyan-400/60 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-medium"
                      : "border-slate-200 text-muted-foreground hover:border-slate-300 hover:text-foreground dark:border-white/10 dark:hover:border-white/20"
                  )}
                >
                  {s} <span className="opacity-60 ml-1">{subjectAnswered}/{subjectQs.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="container py-4 sm:py-6 grid lg:grid-cols-[1fr_300px] gap-4 sm:gap-6">
        {/* Question card */}
        <div className="glass rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Question {idx + 1} of {total}</span>
            <span className="inline-flex items-center gap-1.5 uppercase tracking-wider">
              <BookOpen className="h-3 w-3" />
              {current.subject}
            </span>
          </div>
          <h3 className="mt-3 text-lg md:text-xl leading-relaxed">{current.text}</h3>

          <RadioGroup
            value={answers[current.id] !== null ? String(answers[current.id]) : ""}
            onValueChange={(v) => setAnswers((a) => ({ ...a, [current.id]: parseInt(v) }))}
            className="mt-6 grid gap-2"
          >
            {current.options.map((opt, i) => {
              const selected = answers[current.id] === i;
              return (
                <Label
                  key={i}
                  htmlFor={`opt-${i}`}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all active:scale-[0.99] select-none",
                    selected
                      ? "border-cyan-400/50 bg-cyan-500/10"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-900/[0.02] dark:border-white/10 dark:hover:border-white/20 dark:hover:bg-white/[0.03]"
                  )}
                >
                  <RadioGroupItem value={String(i)} id={`opt-${i}`} className="mt-1" />
                  <span className="text-sm leading-relaxed">
                    <span className="text-muted-foreground mr-2">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </span>
                </Label>
              );
            })}
          </RadioGroup>

          {/* Sticky on mobile so Previous/Next stay thumb-reachable without scrolling past long
              questions; on lg+ it sits inline since the desktop navigator already offers quick jumps. */}
          <div className="sticky bottom-0 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 mt-6 flex flex-wrap items-center justify-between gap-2 rounded-b-2xl border-t border-slate-200 bg-background/95 px-4 sm:px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl dark:border-white/[0.06] lg:static lg:mx-0 lg:mb-0 lg:rounded-none lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
            <Button variant="secondary" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}>
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setMarked((m) => ({ ...m, [current.id]: !m[current.id] }))}
              >
                <Flag className={cn("h-4 w-4", marked[current.id] && "text-orange-600 dark:text-orange-400 fill-orange-500/40 dark:fill-orange-400/40")} />
                <span className="hidden sm:inline">{marked[current.id] ? "Marked" : "Mark for Review"}</span>
              </Button>
              <Button onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}>
                <Save className="h-4 w-4" /> Save &amp; Next
              </Button>
            </div>
            {idx < total - 1 && (
              <Button variant="ghost" size="sm" className="hidden text-muted-foreground lg:inline-flex" onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}>
                Skip <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Navigator (desktop) */}
        <aside className="hidden lg:block">
          <NavigatorCard test={test} idx={idx} setIdx={setIdx} answers={answers} marked={marked} />
        </aside>
      </div>

      {/* Mobile navigator sheet */}
      <Dialog open={showNav} onOpenChange={setShowNav}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Questions</DialogTitle>
            <DialogDescription>Jump to any question.</DialogDescription>
          </DialogHeader>
          <NavigatorCard
            test={test}
            idx={idx}
            setIdx={(i) => { setIdx(i); setShowNav(false); }}
            answers={answers}
            marked={marked}
            compact
          />
        </DialogContent>
      </Dialog>

      {/* Submit confirm */}
      <Dialog open={showSubmit} onOpenChange={(open) => { if (!submitting) setShowSubmit(open); }}>
        <DialogContent showClose={!submitting}>
          {submitting ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-700 dark:text-cyan-400" />
              <p className="font-medium">Submitting your test…</p>
              <p className="text-sm text-muted-foreground">Please don't close this window.</p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" /> Submit test?
                </DialogTitle>
                <DialogDescription>
                  You have answered {answeredCount} of {total} questions. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg border border-slate-200 dark:border-white/10 p-3"><p className="text-lg font-semibold text-green-700 dark:text-green-400">{answeredCount}</p><p className="text-muted-foreground">Answered</p></div>
                <div className="rounded-lg border border-slate-200 dark:border-white/10 p-3"><p className="text-lg font-semibold text-orange-600 dark:text-orange-400">{Object.values(marked).filter(Boolean).length}</p><p className="text-muted-foreground">Marked</p></div>
                <div className="rounded-lg border border-slate-200 dark:border-white/10 p-3"><p className="text-lg font-semibold text-muted-foreground">{total - answeredCount}</p><p className="text-muted-foreground">Unanswered</p></div>
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setShowSubmit(false)}>Keep testing</Button>
                <Button variant="destructive" onClick={submit}>Submit test</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NavigatorCard({
  test, idx, setIdx, answers, marked, compact,
}: {
  test: MockTest;
  idx: number;
  setIdx: (i: number) => void;
  answers: Record<string, number | null>;
  marked: Record<string, boolean>;
  compact?: boolean;
}) {
  // Memoize grouped questions — avoids O(n²) re-filtering on every answer change
  const questionsBySubject = useMemo(() => {
    const map: Record<string, { q: MockTest['questions'][number]; i: number }[]> = {};
    test.questions.forEach((q, i) => {
      if (!map[q.subject]) map[q.subject] = [];
      map[q.subject].push({ q, i });
    });
    return map;
  }, [test.questions]);

  const subjects = useMemo(() => Object.keys(questionsBySubject), [questionsBySubject]);

  return (
    <div className={cn("glass rounded-2xl p-4 space-y-4 max-h-[calc(100vh-10rem)] overflow-y-auto", compact && "p-0 border-0 bg-transparent shadow-none")}>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <Legend color="bg-green-500/70" label="Answered" />
        <Legend color="bg-slate-300 dark:bg-white/20" label="Unanswered" />
        <Legend color="bg-cyan-500/70" label="Current" />
        <Legend color="bg-orange-500/70" label="Marked" />
      </div>

      {subjects.map((subject) => {
        const subjectQs = questionsBySubject[subject];

        return (
          <div key={subject}>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">{subject}</p>
            <div className="grid grid-cols-6 gap-1">
              {subjectQs.map(({ q, i }) => {
                const isCurrent = i === idx;
                const isAnswered = answers[q.id] !== null;
                const isMarked = marked[q.id];
                return (
                  <button
                    key={q.id}
                    onClick={() => setIdx(i)}
                    aria-label={`Go to question ${i + 1}`}
                    className={cn(
                      "h-8 rounded-md text-[10px] font-medium border transition",
                      isCurrent
                        ? "bg-cyan-500/80 border-cyan-400 text-white"
                        : isMarked
                          ? "bg-orange-500/20 border-orange-400/40 text-orange-700 dark:text-orange-200"
                          : isAnswered
                            ? "bg-green-500/20 border-green-400/40 text-green-700 dark:text-green-200"
                            : "bg-slate-900/[0.02] border-slate-200 hover:border-slate-300 dark:bg-white/[0.03] dark:border-white/10 dark:hover:border-white/20"
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className={cn("h-2.5 w-2.5 rounded-sm", color)} />
      {label}
    </div>
  );
}
