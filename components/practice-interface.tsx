"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Bookmark, BookmarkCheck, Grid3x3, X, CheckCircle2, XCircle, Trophy, RotateCcw, ArrowLeft,
} from "lucide-react";

export interface PracticeQuestion {
  id: string;
  subject: string;
  topic: string | null;
  subtopic: string | null;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
  previouslyAnswered?: boolean;
}

interface Props {
  questions: PracticeQuestion[];
  subject: string;
  topic: string | null;
  subtopic?: string | null;
}

type Answers = Record<string, number | null>;

export function PracticeInterface({ questions: initialQuestions, subject, topic, subtopic }: Props) {
  // Shuffled client-side, after mount, so server and client render the same
  // initial order (avoids an SSR/hydration mismatch) while still varying the
  // order between practice sessions.
  const [questions, setQuestions] = useState(initialQuestions);
  useEffect(() => {
    // Shuffle for variety, but keep unanswered questions (server-sorted
    // first) ahead of previously-answered ones — shuffling each segment
    // separately preserves that resume-at-new-material ordering.
    const shuffle = <T,>(arr: T[]) => {
      const out = [...arr];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    };
    setQuestions((qs) => {
      const unanswered = qs.filter((q) => !q.previouslyAnswered);
      const answered = qs.filter((q) => q.previouslyAnswered);
      return [...shuffle(unanswered), ...shuffle(answered)];
    });
  }, []);

  const total = questions.length;
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [showGrid, setShowGrid] = useState(false);
  const [finished, setFinished] = useState(false);

  const current = questions[idx];
  const selected = answers[current.id] ?? null;
  const isAnswered = selected !== null && selected !== undefined;
  const isCorrect = isAnswered && selected === current.correctIndex;
  const isLast = idx === total - 1;

  const stats = useMemo(() => {
    let correct = 0, wrong = 0;
    for (const q of questions) {
      const a = answers[q.id];
      if (a === null || a === undefined) continue;
      if (a === q.correctIndex) correct += 1;
      else wrong += 1;
    }
    return { correct, wrong, skipped: total - correct - wrong };
  }, [answers, questions, total]);

  const selectOption = (optionIndex: number) => {
    if (isAnswered) return;
    setAnswers((a) => ({ ...a, [current.id]: optionIndex }));
    // Fire-and-forget: don't block the UI on this, and a failure here
    // shouldn't interrupt the practice session.
    fetch("/api/practice/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Send the raw selected index, not a client-computed "correct"
      // boolean — the server looks up the real answer itself so a direct
      // API call can't fake accuracy stats used by mock-test readiness.
      body: JSON.stringify({ questionId: current.id, selectedIndex: optionIndex }),
    }).catch(() => {});
  };

  const goTo = (i: number) => {
    setIdx(Math.max(0, Math.min(total - 1, i)));
    setShowGrid(false);
  };

  const next = () => {
    if (isLast) setFinished(true);
    else setIdx((i) => i + 1);
  };

  const toggleBookmark = () => {
    setBookmarked((prev) => {
      const next = new Set(prev);
      next.has(current.id) ? next.delete(current.id) : next.add(current.id);
      return next;
    });
  };

  const restart = () => {
    setAnswers({});
    setIdx(0);
    setFinished(false);
  };

  const breadcrumb = [subject, topic, subtopic].filter(Boolean).join(" → ");

  if (finished) {
    const accuracy = stats.correct + stats.wrong > 0 ? Math.round((stats.correct / (stats.correct + stats.wrong)) * 100) : 0;
    return (
      <div className="container py-16 flex justify-center">
        <Card className="w-full max-w-md p-7 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-400/20 mx-auto">
            <Trophy className="h-7 w-7 text-cyan-700 dark:text-cyan-400" />
          </div>
          <h1 className="mt-4 text-xl font-semibold">Practice complete</h1>
          <p className="text-sm text-muted-foreground mt-1">{breadcrumb}</p>

          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg border border-slate-200 dark:border-white/10 p-3"><p className="text-lg font-semibold text-green-700 dark:text-green-400">{stats.correct}</p><p className="text-muted-foreground">Correct</p></div>
            <div className="rounded-lg border border-slate-200 dark:border-white/10 p-3"><p className="text-lg font-semibold text-red-700 dark:text-red-400">{stats.wrong}</p><p className="text-muted-foreground">Wrong</p></div>
            <div className="rounded-lg border border-slate-200 dark:border-white/10 p-3"><p className="text-lg font-semibold text-muted-foreground">{stats.skipped}</p><p className="text-muted-foreground">Skipped</p></div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Accuracy: <span className="text-foreground font-medium">{accuracy}%</span></p>

          <div className="mt-6 flex flex-col gap-2">
            <Button onClick={restart}><RotateCcw className="h-4 w-4" /> Practice again</Button>
            <Button variant="secondary" asChild><Link href="/practice"><ArrowLeft className="h-4 w-4" /> Choose another topic</Link></Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header — no global navbar on this route (see components/app-chrome.tsx) */}
      <div className="border-b border-slate-200 bg-background/80 backdrop-blur-xl sticky top-0 z-30 dark:border-white/[0.06]">
        <div className="container py-3 flex items-center gap-3">
          <button
            onClick={toggleBookmark}
            className="shrink-0 h-9 w-9 rounded-lg border border-slate-200 bg-slate-900/[0.02] inline-flex items-center justify-center hover:border-slate-300 transition dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20"
            aria-label="Bookmark question"
          >
            {bookmarked.has(current.id)
              ? <BookmarkCheck className="h-4 w-4 text-cyan-700 dark:text-cyan-400" />
              : <Bookmark className="h-4 w-4 text-muted-foreground" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{breadcrumb}</p>
          </div>
          <span className="text-sm font-mono text-orange-700 dark:text-orange-400 shrink-0">{idx + 1}/{total}</span>
          <button
            onClick={() => setShowGrid((v) => !v)}
            className="shrink-0 h-9 w-9 rounded-lg border border-slate-200 bg-slate-900/[0.02] inline-flex items-center justify-center hover:border-slate-300 transition dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20"
            aria-label="Question navigator"
          >
            <Grid3x3 className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Number pills */}
        <div className="container pb-3 flex gap-1.5 overflow-x-auto scrollbar-hide">
          {questions.map((q, i) => {
            const a = answers[q.id];
            const answered = a !== null && a !== undefined;
            const correct = answered && a === q.correctIndex;
            return (
              <button
                key={q.id}
                onClick={() => goTo(i)}
                className={cn(
                  "shrink-0 h-8 w-8 rounded-full text-xs font-medium border inline-flex items-center justify-center transition",
                  i === idx ? "border-cyan-400/60 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
                    : answered
                    ? correct ? "border-green-400/30 text-green-700 dark:text-green-400" : "border-red-400/30 text-red-700 dark:text-red-400"
                    : "border-slate-200 text-muted-foreground hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20"
                )}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {showGrid && (
          <div className="container pb-4">
            <div className="rounded-xl border border-slate-200 bg-background/95 p-3 grid grid-cols-8 sm:grid-cols-10 gap-1.5 dark:border-white/10">
              {questions.map((q, i) => {
                const a = answers[q.id];
                const answered = a !== null && a !== undefined;
                const correct = answered && a === q.correctIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => goTo(i)}
                    className={cn(
                      "h-8 rounded-md text-xs font-medium border inline-flex items-center justify-center transition",
                      i === idx ? "border-cyan-400/60 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
                        : answered
                        ? correct ? "border-green-400/30 bg-green-500/10 text-green-700 dark:text-green-400" : "border-red-400/30 bg-red-500/10 text-red-700 dark:text-red-400"
                        : "border-slate-200 text-muted-foreground hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20"
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Question */}
      <div className="container py-6 max-w-2xl flex-1">
        {current.previouslyAnswered && !isAnswered && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-400/20 rounded-full px-2.5 py-1 mb-3">
            <RotateCcw className="h-3 w-3" /> Reviewing a question you've answered before
          </span>
        )}
        <p className="text-lg leading-relaxed">{current.text}</p>

        <div className="mt-6 space-y-3">
          {current.options.map((opt, oi) => {
            const isThisCorrect = oi === current.correctIndex;
            const isThisSelected = oi === selected;
            const showCorrect = isAnswered && isThisCorrect;
            const showWrong = isAnswered && isThisSelected && !isThisCorrect;
            return (
              <button
                key={oi}
                onClick={() => selectOption(oi)}
                disabled={isAnswered}
                className={cn(
                  "w-full text-left px-5 py-4 rounded-2xl border text-sm font-medium transition-all",
                  showCorrect ? "border-green-400/60 bg-green-500/15 text-green-800 dark:text-green-100"
                    : showWrong ? "border-red-400/60 bg-red-500/15 text-red-800 dark:text-red-100"
                    : isAnswered ? "border-slate-200 dark:border-white/[0.06] text-muted-foreground opacity-60"
                    : "border-slate-200 bg-slate-900/[0.02] hover:border-cyan-400/40 hover:bg-cyan-500/[0.04] active:scale-[0.99] dark:border-white/10 dark:bg-white/[0.03]"
                )}
              >
                <span className="flex items-center justify-between gap-3">
                  <span>{opt}</span>
                  {showCorrect && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-700 dark:text-green-400" />}
                  {showWrong && <XCircle className="h-4 w-4 shrink-0 text-red-700 dark:text-red-400" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation bottom sheet */}
      {isAnswered && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={next} />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl glass border-t border-slate-200 dark:border-white/10 p-6 pb-[max(2rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-300 sm:left-1/2 sm:bottom-6 sm:-translate-x-1/2 sm:w-full sm:max-w-lg sm:rounded-3xl sm:border sm:pb-8">
            <div className="mx-auto h-1 w-10 rounded-full bg-slate-300 dark:bg-white/15 sm:hidden mb-4" />
            <div className="flex flex-col items-center text-center gap-3">
              <div className={cn(
                "h-14 w-14 rounded-full inline-flex items-center justify-center",
                isCorrect ? "bg-green-500/15" : "bg-red-500/15"
              )}>
                {isCorrect
                  ? <CheckCircle2 className="h-8 w-8 text-green-700 dark:text-green-400" />
                  : <XCircle className="h-8 w-8 text-red-700 dark:text-red-400" />}
              </div>
              <p className="text-sm">
                Answer: <span className="text-green-700 dark:text-green-400 font-semibold">{current.options[current.correctIndex]}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {current.explanation || "No explanation available for this question yet."}
              </p>
              <Button className="w-full mt-2" size="lg" onClick={next}>
                {isLast ? "Finish" : "Next"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
