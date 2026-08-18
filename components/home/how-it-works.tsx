"use client";
import { motion } from "framer-motion";
import { ClipboardList, PenLine, TrendingUp } from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: ClipboardList,
    title: "Choose Your Exam",
    description: "Pick IOE or CEE, then a full mock test or a subject-wise set at your difficulty.",
  },
  {
    n: "02",
    icon: PenLine,
    title: "Practice Under Real Conditions",
    description: "Timed sections, negative marking, and question navigation that mirrors the real exam.",
  },
  {
    n: "03",
    icon: TrendingUp,
    title: "Review & Improve",
    description: "Instant scoring, subject-wise breakdowns, and explanations for every question you missed.",
  },
];

export function HowItWorks() {
  return (
    <section className="container py-10 md:py-14">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 font-medium">How it works</p>
        <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
          Three steps to a better rank.
        </h2>
      </div>

      <div className="relative mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
        {/* Connecting line — desktop only, drawn behind the step cards */}
        <div
          className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-white/15 md:block"
          aria-hidden="true"
        />

        {STEPS.map((step, i) => (
          <motion.div
            key={step.n}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-blue-600 shadow-sm dark:border-white/10 dark:bg-[#0A1020] dark:text-blue-300 dark:shadow-none">
              <step.icon className="h-6 w-6" />
              <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-[10px] font-bold text-white shadow-lg shadow-blue-500/30">
                {step.n}
              </span>
            </div>
            <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
