"use client";
import { useEffect, useRef, useState } from "react";
import { Users, FileText, HelpCircle, Trophy } from "lucide-react";
import { motion, useInView } from "framer-motion";

const STATS = [
  { icon: Users, label: "Students", value: 1240, suffix: "+", color: "text-blue-400", bg: "from-blue-500/20 to-blue-500/5" },
  { icon: FileText, label: "Mock Tests", value: 12, suffix: "", color: "text-cyan-400", bg: "from-cyan-500/20 to-cyan-500/5" },
  { icon: HelpCircle, label: "Questions", value: 10000, suffix: "+", color: "text-purple-400", bg: "from-purple-500/20 to-purple-500/5" },
  { icon: Trophy, label: "Tests Attempted", value: 4800, suffix: "+", color: "text-orange-400", bg: "from-orange-500/20 to-orange-500/5" },
];

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

export function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="container py-14">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <StatCard key={s.label} inView={inView} {...s} delay={i * 0.08} />
        ))}
      </div>
    </section>
  );
}

function StatCard({ icon: Icon, label, value, suffix, color, bg, inView, delay }: any) {
  const n = useCountUp(value, inView);
  const formatted = n.toLocaleString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="glass rounded-2xl p-5 md:p-6 relative overflow-hidden"
    >
      <div className={`absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br ${bg} blur-2xl`} />
      <div className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/10 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="relative mt-4 text-2xl md:text-3xl font-semibold tracking-tight">
        {formatted}
        <span className={color}>{suffix}</span>
      </p>
      <p className="relative text-xs text-muted-foreground mt-1">{label}</p>
    </motion.div>
  );
}
