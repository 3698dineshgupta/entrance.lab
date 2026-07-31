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
  IOE: "from-blue-500/20 to-cyan-500/10 text-cyan-300 border-blue-400/20",
  CEE: "from-orange-500/20 to-purple-500/10 text-orange-300 border-orange-400/20",
};

export function ExamCards() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ExamType>("IOE");

  return (
    <section className="container py-16 md:py-20">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-medium">Choose your path</p>
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
          >
            <Card className="p-6 md:p-7 h-full glass-hover group">
              <div className="flex items-start justify-between gap-4">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${ACCENTS[e.id]} border`}>
                  {ICONS[e.id]}
                </div>
                <span className="text-xs px-2 py-1 rounded-full border border-white/10 bg-white/[0.02] text-muted-foreground">
                  {e.id}
                </span>
              </div>

              <h3 className="mt-5 text-xl font-semibold">{e.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{e.description}</p>

              <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
                <Stat icon={<BookOpen className="h-3.5 w-3.5" />} label="Subjects" value={String(e.subjects.length)} />
                <Stat icon={<ListChecks className="h-3.5 w-3.5" />} label="Questions" value={String(e.totalQuestions)} />
                <Stat icon={<Clock className="h-3.5 w-3.5" />} label="Duration" value={`${e.durationMinutes}m`} />
              </div>

              <div className="mt-5 flex flex-wrap gap-1.5">
                {e.subjects.map((s) => (
                  <span key={s} className="text-[11px] px-2 py-1 rounded-md bg-white/[0.03] border border-white/10 text-muted-foreground">
                    {s}
                  </span>
                ))}
              </div>

              <Button
                className="mt-6 w-full"
                variant={e.id === "CEE" ? "accent" : "default"}
                onClick={() => { setSelected(e.id); setOpen(true); }}
              >
                Start Test <ArrowRight className="h-4 w-4" />
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
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-2.5">
      <div className="flex items-center gap-1 text-muted-foreground">{icon}<span>{label}</span></div>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
