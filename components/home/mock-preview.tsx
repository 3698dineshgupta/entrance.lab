"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Clock, Flag, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Real sample questions pulled from the IOE question bank (lib/questions.ts)
// so this preview reflects the actual product rather than invented copy.
const SAMPLE_QUESTIONS = [
  {
    subject: "Physics",
    number: 3,
    difficulty: "Medium" as const,
    text: "A body moves with constant acceleration. If its velocity doubles in 4 seconds, what is its acceleration if initial velocity was 5 m/s?",
    options: ["1.0 m/s²", "1.25 m/s²", "2.5 m/s²", "5.0 m/s²"],
    correctIndex: 1,
  },
  {
    subject: "Chemistry",
    number: 4,
    difficulty: "Hard" as const,
    text: "Which of the following is the strongest Brønsted acid?",
    options: ["HF", "HCl", "HBr", "HI"],
    correctIndex: 3,
  },
];

const DIFFICULTY_STYLES: Record<string, string> = {
  Easy: "border-emerald-400/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  Medium: "border-amber-400/30 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  Hard: "border-red-400/30 bg-red-500/10 text-red-600 dark:text-red-300",
};

// Small circular "AI dashboard" style progress ring, complementing the
// linear bar lower in the card — shows the same real progress (question
// number / total), just as a second, more premium-reading visual.
function ProgressRing({ value }: { value: number }) {
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value);
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0 -rotate-90">
      <circle cx="18" cy="18" r={radius} fill="none" strokeWidth="3" className="stroke-slate-900/[0.06] dark:stroke-white/[0.08]" />
      <circle
        cx="18"
        cy="18"
        r={radius}
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        stroke="url(#mockPreviewRingGradient)"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
      <defs>
        <linearGradient id="mockPreviewRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F6BFF" />
          <stop offset="100%" stopColor="#3DD9FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function MockPreview() {
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const q = SAMPLE_QUESTIONS[qIndex];

  const next = () => {
    setQIndex((i) => (i + 1) % SAMPLE_QUESTIONS.length);
    setSelected(null);
  };

  return (
    <section className="container py-10 md:py-14">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400 font-medium">The test experience</p>
        <h2 className="font-heading mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
          Practice like the real exam.
        </h2>
        <p className="mt-3 text-muted-foreground">
          Timed sections, question navigation, and negative marking — the same interface you&rsquo;ll sit an actual mock test in.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, rotateX: 4 }}
        whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformPerspective: 1400 }}
        className="mx-auto mt-12 max-w-3xl"
      >
        <div className="glass overflow-hidden rounded-2xl shadow-2xl shadow-slate-900/10 dark:shadow-black/50">
          {/* Frame chrome */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900/[0.02] px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-900/[0.03] px-3 py-1 text-xs text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-300">
              <Clock className="h-3.5 w-3.5 text-[#3DD9FF]" />
              01:58:42
            </div>
          </div>

          <div className="p-5 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#4F6BFF]/25 bg-[#4F6BFF]/[0.08] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-blue-700 dark:text-[#8FB4FF]">
                  {q.subject}
                </span>
                <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-medium", DIFFICULTY_STYLES[q.difficulty])}>
                  {q.difficulty}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-muted-foreground">Question {q.number} of 40</span>
                <ProgressRing value={q.number / 40} />
              </div>
            </div>

            <motion.p
              key={qIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mt-4 text-base font-medium leading-relaxed text-foreground md:text-lg"
            >
              {q.text}
            </motion.p>

            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {q.options.map((opt, i) => {
                const isSelected = selected === i;
                const revealed = selected !== null;
                const isCorrect = i === q.correctIndex;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSelected(i)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-all",
                      revealed && isCorrect && "border-green-400/40 bg-green-500/[0.08] text-green-700 dark:text-green-200",
                      revealed && isSelected && !isCorrect && "border-red-400/40 bg-red-500/[0.08] text-red-700 dark:text-red-200",
                      !revealed && "border-slate-200 bg-slate-900/[0.02] text-foreground hover:border-slate-300 hover:bg-slate-900/[0.05] dark:border-white/10 dark:bg-white/[0.02] dark:text-neutral-200 dark:hover:border-white/20 dark:hover:bg-white/[0.05]"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium",
                        revealed && isCorrect && "border-green-400/50 bg-green-500/20",
                        revealed && isSelected && !isCorrect && "border-red-400/50 bg-red-500/20",
                        !revealed && "border-slate-300 text-slate-500 dark:border-white/15 dark:text-neutral-400"
                      )}
                    >
                      {revealed && isCorrect ? <Check className="h-3 w-3" /> : revealed && isSelected ? <X className="h-3 w-3" /> : String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-900/[0.03] px-3 py-2 text-xs text-slate-600 transition hover:bg-slate-900/[0.06] dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-300 dark:hover:bg-white/[0.06]"
              >
                <Flag className="h-3.5 w-3.5" /> Mark for review
              </button>
              <button
                type="button"
                onClick={next}
                className="btn-shine rounded-full bg-gradient-to-r from-[#4F6BFF] to-[#8B5CF6] px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-[#4F6BFF]/25 transition hover:scale-[1.02] hover:brightness-110"
              >
                Next Question
              </button>
            </div>

            {/* Progress bar */}
            <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-900/[0.06] dark:bg-white/[0.06]">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${(q.number / 40) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="h-full rounded-full bg-gradient-to-r from-[#4F6BFF] to-[#3DD9FF]"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
