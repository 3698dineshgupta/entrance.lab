"use client";
import { motion } from "framer-motion";
import { Timer, LineChart, ListTree, CheckCircle2, BookOpenCheck, Repeat } from "lucide-react";

const FEATURES = [
  {
    icon: Timer,
    title: "Full-Length Timed Mocks",
    description: "IOE and CEE mock tests with real durations and negative marking, sat exactly like the actual exam.",
  },
  {
    icon: ListTree,
    title: "Subject-Wise Practice",
    description: "Drill a single subject — Physics, Chemistry, Botany, Zoology, or Maths — at your own pace.",
  },
  {
    icon: LineChart,
    title: "Detailed Analytics",
    description: "Score trends, subject-wise accuracy, and readiness tracking across every attempt you make.",
  },
  {
    icon: CheckCircle2,
    title: "Instant Scoring",
    description: "See your result the moment you submit — no waiting, with a full answer review attached.",
  },
  {
    icon: BookOpenCheck,
    title: "Explanations, Not Just Answers",
    description: "Every question comes with a worked explanation so wrong answers actually teach you something.",
  },
  {
    icon: Repeat,
    title: "Retake & Track Progress",
    description: "Attempt the same subject again and watch your accuracy move over time in your analytics.",
  },
];

export function FeaturesGrid() {
  return (
    <section className="container py-16 md:py-20">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400 font-medium">Why EntranceLab</p>
        <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
          Everything you need to prepare, in one place.
        </h2>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
            whileHover={{ y: -4 }}
            className="glass glass-hover group rounded-2xl p-5 md:p-6"
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-900/[0.03] text-blue-600 transition-transform duration-300 group-hover:scale-110 group-hover:text-cyan-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-blue-300 dark:group-hover:text-cyan-300">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
