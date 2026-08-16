"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ClipboardList, BookOpen } from "lucide-react";
import { ExamSelectionModal } from "@/components/exam-selection-modal";

// Mobile-only hero (rendered by <Hero> behind `md:hidden`) — the desktop
// hero is a completely separate block and is untouched by anything here.
//
// Open, card-less composition: content sits directly on the page's soft
// gradient background (plus one extra local glow) rather than inside a
// bordered box. Centered text, one strong primary CTA, exactly two
// secondary quick actions — real EntranceLab destinations, not a crowded
// grid of every feature.
export function MobileHero({
  questionCount,
  mockTestCount,
}: {
  questionCount: number | null;
  mockTestCount: number | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative overflow-hidden px-1 pb-10 pt-5 text-center md:hidden bg-[linear-gradient(180deg,#EAF3FF_0%,#F4F7FF_55%,#F3EEFF_100%)] dark:bg-none">
      <div
        className="pointer-events-none absolute inset-0 dark:opacity-60"
        style={{
          background:
            "radial-gradient(circle at 20% 15%, rgba(59,130,246,0.10), transparent 35%), radial-gradient(circle at 80% 30%, rgba(124,58,237,0.08), transparent 35%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[600px]">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-blue-500/[0.12] bg-blue-500/10 px-4 py-2 text-xs font-medium text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/15 dark:text-blue-300"
        >
          <Sparkles className="h-3 w-3" />
          Free IOE &amp; CEE Mock Tests
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="font-extrabold leading-[1.25] tracking-tight text-slate-900 dark:text-white"
          style={{ fontSize: "clamp(1.5rem, 7vw, 1.875rem)" }}
        >
          Your Complete{" "}
          <span className="whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">
            Exam Prep
          </span>
          <br />
          for Nepalese Students
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-5 max-w-[340px] text-base leading-7 text-slate-600 dark:text-neutral-300"
        >
          Practice mock tests, solve real exam questions, and track your performance. Everything in one place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-8 px-4"
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-blue-500 to-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98]"
          >
            Start Practicing
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <Link
              href="/mock-tests"
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-3.5 text-sm font-medium text-slate-700 shadow-sm transition-all active:scale-[0.98] dark:border-white/15 dark:bg-white/[0.04] dark:text-white/90"
            >
              <ClipboardList className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Mock Tests
            </Link>
            <Link
              href="/practice"
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-3.5 text-sm font-medium text-slate-700 shadow-sm transition-all active:scale-[0.98] dark:border-white/15 dark:bg-white/[0.04] dark:text-white/90"
            >
              <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Practice
            </Link>
          </div>
        </motion.div>

        {(questionCount || mockTestCount) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="mt-6 text-xs text-slate-500 dark:text-neutral-400"
          >
            {questionCount ? <span className="font-semibold text-slate-700 dark:text-neutral-200">{questionCount.toLocaleString()}+ Questions</span> : null}
            {questionCount && mockTestCount ? " · " : ""}
            {mockTestCount ? <span className="font-semibold text-slate-700 dark:text-neutral-200">{mockTestCount} Mock Tests</span> : null}
            {" · "}Real Exam Pattern
          </motion.p>
        )}
      </div>

      <ExamSelectionModal open={open} onOpenChange={setOpen} defaultExam="IOE" />
    </div>
  );
}
