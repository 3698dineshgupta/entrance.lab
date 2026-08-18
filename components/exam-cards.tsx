"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Atom, Stethoscope, Clock, BookOpen, ListChecks, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EXAMS } from "@/lib/questions";
import { ExamType } from "@/lib/types";
import { ExamSelectionModal } from "./exam-selection-modal";

const ICONS: Record<ExamType, React.ReactNode> = {
  IOE: <Atom className="h-6 w-6" />,
  CEE: <Stethoscope className="h-6 w-6" />,
};

const ACCENTS: Record<ExamType, string> = {
  IOE: "from-blue-500/20 to-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-blue-400/20",
  CEE: "from-orange-500/20 to-purple-500/10 text-orange-700 dark:text-orange-300 border-orange-400/20",
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

      <div className="mt-10 grid md:grid-cols-2 gap-5">
        {EXAMS.map((e, i) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            whileHover={{ y: -6 }}
            style={{ transformPerspective: 1000 }}
            className="group"
          >
            <Card className="relative h-full overflow-hidden p-6 md:p-7 glass-hover transition-shadow duration-300 group-hover:shadow-2xl group-hover:shadow-blue-500/10">
              <div
                className={`pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-gradient-to-br ${ACCENTS[e.id]} opacity-30 blur-3xl transition-transform duration-500 group-hover:scale-125`}
                aria-hidden="true"
              />

              <div className="relative flex items-start justify-between gap-4">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${ACCENTS[e.id]} border transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
                  {ICONS[e.id]}
                </div>
                <span className="text-xs px-2 py-1 rounded-full border border-slate-200 bg-slate-900/[0.02] text-muted-foreground dark:border-white/10 dark:bg-white/[0.02]">
                  {e.id}
                </span>
              </div>

              <h3 className="relative mt-5 text-xl font-semibold">{e.name}</h3>
              <p className="relative mt-2 text-sm text-muted-foreground leading-relaxed">{e.description}</p>

              <div className="relative mt-5 grid grid-cols-3 gap-3 text-xs">
                <Stat icon={<BookOpen className="h-3.5 w-3.5" />} label="Subjects" value={String(e.subjects.length)} />
                <Stat icon={<ListChecks className="h-3.5 w-3.5" />} label="Questions" value={String(e.totalQuestions)} />
                <Stat icon={<Clock className="h-3.5 w-3.5" />} label="Duration" value={`${e.durationMinutes}m`} />
              </div>

              <div className="relative mt-5 flex flex-wrap gap-1.5">
                {e.subjects.map((s) => (
                  <span key={s} className="text-[11px] px-2 py-1 rounded-md bg-slate-900/[0.03] border border-slate-200 text-muted-foreground dark:bg-white/[0.03] dark:border-white/10">
                    {s}
                  </span>
                ))}
              </div>

              <Button
                className="relative mt-6 w-full rounded-full transition-transform group-hover:scale-[1.02]"
                variant={e.id === "CEE" ? "accent" : "default"}
                onClick={() => { setSelected(e.id); setOpen(true); }}
              >
                Start Test <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>

      <ExamSelectionModal open={open} onOpenChange={setOpen} defaultExam={selected} />
    </section>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-900/[0.02] p-2.5 dark:border-white/[0.08] dark:bg-white/[0.02]">
      <div className="flex items-center gap-1 text-muted-foreground">{icon}<span>{label}</span></div>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
