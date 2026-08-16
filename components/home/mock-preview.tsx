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
    text: "A body moves with constant acceleration. If its velocity doubles in 4 seconds, what is its acceleration if initial velocity was 5 m/s?",
    options: ["1.0 m/s²", "1.25 m/s²", "2.5 m/s²", "5.0 m/s²"],
    correctIndex: 1,
  },
  {
    subject: "Chemistry",
    number: 4,
    text: "Which of the following is the strongest Brønsted acid?",
    options: ["HF", "HCl", "HBr", "HI"],
    correctIndex: 3,
  },
];

export function MockPreview() {
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const q = SAMPLE_QUESTIONS[qIndex];

  const next = () => {
    setQIndex((i) => (i + 1) % SAMPLE_QUESTIONS.length);
    setSelected(null);
  };

  return (
    <section className="container py-16 md:py-20">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-400 font-medium">The test experience</p>
        <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
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
              <Clock className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-300" />
              01:58:42
            </div>
          </div>

          <div className="p-5 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full border border-blue-400/20 bg-blue-500/[0.08] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-blue-600 dark:text-blue-300">
                {q.subject}
              </span>
              <span className="text-xs text-muted-foreground">Question {q.number} of 40</span>
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
                className="rounded-full bg-gradient-to-b from-blue-500 to-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:scale-[1.02] hover:from-blue-400 hover:to-blue-500"
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
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
