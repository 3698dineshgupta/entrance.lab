"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Atom, Stethoscope, Clock, BookOpen, ListChecks, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EXAMS } from "@/lib/questions";
import { ExamType } from "@/lib/types";
import { ExamSelectionModal } from "./exam-selection-modal";
import { cn } from "@/lib/utils";

// Each exam gets its own full color identity (not just an icon tint) so the
// two cards read as distinct products, not one template reused twice.
const EXAM_STYLE: Record<
  ExamType,
  {
    Icon: typeof Atom;
    topBar: string;
    iconBg: string;
    iconText: string;
    iconGlow: string;
    blob: string;
    chip: string;
    statTint: string;
    tagTint: string;
    buttonVariant: "default" | "accent";
  }
> = {
  IOE: {
    Icon: Atom,
    topBar: "from-[#4F6BFF] to-[#3DD9FF]",
    iconBg: "from-[#4F6BFF]/25 to-[#3DD9FF]/10 border-[#4F6BFF]/25",
    iconText: "text-blue-700 dark:text-[#8FB4FF]",
    iconGlow: "bg-[#4F6BFF]/40",
    blob: "from-[#4F6BFF]/30 to-[#3DD9FF]/10",
    chip: "border-[#4F6BFF]/25 bg-[#4F6BFF]/[0.08] text-blue-700 dark:text-[#8FB4FF]",
    statTint: "bg-[#4F6BFF]/[0.04] border-[#4F6BFF]/15 dark:bg-[#4F6BFF]/[0.05] dark:border-[#4F6BFF]/20",
    tagTint: "bg-[#4F6BFF]/[0.05] border-[#4F6BFF]/20 text-blue-700 dark:text-[#8FB4FF]",
    buttonVariant: "default",
  },
  CEE: {
    Icon: Stethoscope,
    topBar: "from-orange-500 to-pink-500",
    iconBg: "from-orange-500/25 to-pink-500/10 border-orange-400/25",
    iconText: "text-orange-600 dark:text-orange-300",
    iconGlow: "bg-orange-500/40",
    blob: "from-orange-500/30 to-pink-500/10",
    chip: "border-orange-400/25 bg-orange-500/[0.08] text-orange-700 dark:text-orange-300",
    statTint: "bg-orange-500/[0.04] border-orange-400/15 dark:bg-orange-500/[0.05] dark:border-orange-400/20",
    tagTint: "bg-orange-500/[0.05] border-orange-400/20 text-orange-700 dark:text-orange-300",
    buttonVariant: "accent",
  },
};

export function ExamCards() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ExamType>("IOE");

  return (
    <section className="container py-10 md:py-14">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-400 font-medium">Choose your path</p>
        <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">Two exams. One place to prepare.</h2>
        <p className="mt-3 text-muted-foreground">
          Pick an examination to see full mock tests, subject-wise practice sets, and detailed analytics.
        </p>
      </div>

      <div className="mt-10 grid md:grid-cols-2 gap-6">
        {EXAMS.map((e, i) => {
          const style = EXAM_STYLE[e.id];
          return (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              style={{ transformPerspective: 1000 }}
              className="group"
            >
              <Card className="relative h-full overflow-hidden p-7 md:p-8 glass-hover transition-shadow duration-300 group-hover:shadow-2xl group-hover:shadow-blue-500/10">
                {/* Signature gradient edge — the single strongest visual cue
                    that these are two distinct products, not one template. */}
                <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", style.topBar)} aria-hidden="true" />

                {/* Giant, near-invisible icon watermark for depth/texture */}
                <style.Icon
                  className="pointer-events-none absolute -bottom-8 -right-8 h-40 w-40 text-slate-900/[0.03] dark:text-white/[0.03] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
                  aria-hidden="true"
                  strokeWidth={1}
                />
                <div
                  className={cn("pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-gradient-to-br opacity-60 blur-3xl transition-transform duration-500 group-hover:scale-125", style.blob)}
                  aria-hidden="true"
                />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="relative">
                    <span
                      className={cn("absolute -inset-2 rounded-2xl blur-lg opacity-70 transition-opacity duration-300 group-hover:opacity-100", style.iconGlow)}
                      aria-hidden="true"
                    />
                    <div className={cn("relative inline-flex h-14 w-14 items-center justify-center rounded-2xl border bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3", style.iconBg, style.iconText)}>
                      <style.Icon className="h-7 w-7" />
                    </div>
                  </div>
                  <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", style.chip)}>
                    {e.id}
                  </span>
                </div>

                <h3 className="relative mt-6 text-2xl font-bold tracking-tight">{e.name}</h3>
                <p className="relative mt-2 text-sm text-muted-foreground leading-relaxed">{e.description}</p>

                <div className="relative mt-6 grid grid-cols-3 gap-3 text-xs">
                  <Stat icon={<BookOpen className="h-3.5 w-3.5" />} label="Subjects" value={String(e.subjects.length)} tint={style.statTint} />
                  <Stat icon={<ListChecks className="h-3.5 w-3.5" />} label="Questions" value={String(e.totalQuestions)} tint={style.statTint} />
                  <Stat icon={<Clock className="h-3.5 w-3.5" />} label="Duration" value={`${e.durationMinutes}m`} tint={style.statTint} />
                </div>

                <div className="relative mt-5 flex flex-wrap gap-1.5">
                  {e.subjects.map((s) => (
                    <span key={s} className={cn("text-[11px] font-medium px-2.5 py-1 rounded-md border", style.tagTint)}>
                      {s}
                    </span>
                  ))}
                </div>

                <Button
                  className="relative mt-7 w-full rounded-full transition-transform group-hover:scale-[1.02]"
                  variant={style.buttonVariant}
                  onClick={() => { setSelected(e.id); setOpen(true); }}
                >
                  Start Test <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <ExamSelectionModal open={open} onOpenChange={setOpen} defaultExam={selected} />
    </section>
  );
}

function Stat({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: string; tint: string }) {
  return (
    <div className={cn("rounded-lg border p-2.5", tint)}>
      <div className="flex items-center gap-1 text-muted-foreground">{icon}<span>{label}</span></div>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
