"use client";
import { useEffect, useRef, useState } from "react";
import { Users, FileText, HelpCircle, Trophy } from "lucide-react";
import { motion, useInView } from "framer-motion";
import type { HomeStats } from "@/lib/stats";

function useCountUp(target: number, active: boolean, duration = 1500) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.floor(eased * target));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return n;
}

export function StatsSection({ data }: { data: HomeStats }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const STATS = [
    { icon: Users, label: "Students", value: data.students, suffix: "+", color: "text-blue-600 dark:text-blue-400", bg: "from-blue-500/20 to-blue-500/5", iconBg: "bg-blue-50 dark:bg-blue-500/10" },
    { icon: FileText, label: "Mock Tests", value: data.mockTests, suffix: "", color: "text-cyan-600 dark:text-cyan-400", bg: "from-cyan-500/20 to-cyan-500/5", iconBg: "bg-cyan-50 dark:bg-cyan-500/10" },
    { icon: HelpCircle, label: "Questions", value: data.questions, suffix: "+", color: "text-purple-600 dark:text-purple-400", bg: "from-purple-500/20 to-purple-500/5", iconBg: "bg-purple-50 dark:bg-purple-500/10" },
    { icon: Trophy, label: "Tests Attempted", value: data.attempts, suffix: "+", color: "text-orange-600 dark:text-orange-400", bg: "from-orange-500/20 to-orange-500/5", iconBg: "bg-orange-50 dark:bg-orange-500/10" },
  ];

  return (
    <section ref={ref} className="container py-6 md:py-14">
      <p className="mb-4 text-center text-[11px] md:text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground md:mb-6">
        Trusted by students preparing for IOE &amp; CEE
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {STATS.map((s, i) => (
          <StatCard key={s.label} inView={inView} {...s} delay={i * 0.08} />
        ))}
      </div>
    </section>
  );
}

function StatCard({ icon: Icon, label, value, suffix, color, bg, iconBg, inView, delay }: any) {
  const n = useCountUp(value, inView);
  const formatted = n.toLocaleString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      // Mobile: borderless, centered, pastel icon square — matches the rest
      // of the mobile homepage's lighter, card-less feel. Desktop keeps the
      // original bordered glass card, untouched, via the md: overrides.
      className="relative flex flex-col items-center overflow-hidden rounded-2xl p-3 text-center md:items-start md:p-6 md:text-left md:border md:border-slate-200 md:bg-white/80 md:shadow-sm md:backdrop-blur-xl dark:md:border-white/10 dark:md:bg-white/[0.03]"
    >
      <div className={`hidden md:block absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br ${bg} blur-2xl`} />
      <div className={`relative inline-flex h-11 w-11 md:h-10 md:w-10 items-center justify-center rounded-2xl md:rounded-xl ${iconBg} md:bg-slate-900/[0.03] md:border md:border-slate-200 dark:md:bg-white/[0.04] dark:md:border-white/10 ${color}`}>
        <Icon className="h-5 w-5 md:h-5 md:w-5" />
      </div>
      <p className="relative mt-2.5 md:mt-3 text-lg md:text-3xl font-bold md:font-semibold tracking-tight">
        {formatted}
        <span className={color}>{suffix}</span>
      </p>
      <p className="relative text-xs text-muted-foreground mt-0.5 md:mt-1">{label}</p>
    </motion.div>
  );
}
