"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AttemptSummary } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, XCircle, MinusCircle, Trophy, RotateCcw, Sparkles, Timer,
  Target, TrendingUp, AlertCircle, BarChart2, BookOpen, FileQuestion, Play
} from "lucide-react";
import { formatTime, cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";

type StoredAttempt = {
  testId: string;
  exam: string;
  title: string;
  answers: Record<string, number | null>;
  marked: Record<string, boolean>;
  startedAt: string;
  submittedAt: string;
  durationSeconds: number;
};

export default function ResultsPage() {
  const [summary, setSummary] = useState<AttemptSummary | null>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  // recharts takes literal color strings, not CSS vars — compute once per
  // theme rather than duplicating each chart's axis/grid/tooltip styling.
  const chart = {
    grid: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.08)",
    axis: isDark ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.55)",
    tooltipBg: isDark ? "#0f172a" : "#ffffff",
    tooltipBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)",
    tooltipText: isDark ? "#f1f5f9" : "#0f172a",
  };

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("lastAttempt");
      if (!raw) return;
      const data: StoredAttempt = JSON.parse(raw);
      // We store a lightweight summary shape directly now
      if ((data as any).percentage !== undefined) {
        setSummary(data as any);
      }
    } catch {}
  }, []);

  if (!summary) {
    return (
      <div className="container py-20 sm:py-24 text-center max-w-lg mx-auto">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-400/20 mb-6">
          <FileQuestion className="h-8 w-8 text-cyan-400" />
        </div>
        <h1 className="text-2xl font-semibold">No recent attempt found</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Results are shown right after you submit a mock test — start one to see your score, accuracy, and answer review here.
        </p>
        <Button asChild className="mt-6" size="lg"><Link href="/mock-tests"><Play className="h-4 w-4" /> Browse mock tests</Link></Button>
      </div>
    );
  }

  const barData = Object.entries(summary.bySubject).map(([subject, v]) => ({
    subject: subject.slice(0, 4),
    accuracy: (v as any).accuracy as number,
    correct: (v as any).correct as number,
    total: (v as any).total as number,
  }));

  const radarData = Object.entries(summary.bySubject).map(([subject, v]) => ({
    subject,
    score: (v as any).accuracy as number,
    fullMark: 100,
  }));

  // subjects with accuracy < 60%
  const weakSubjects = Object.entries(summary.bySubject)
    .filter(([, v]) => (v as any).accuracy < 60)
    .sort(([, a], [, b]) => (a as any).accuracy - (b as any).accuracy);

  const percentile = Math.max(35, Math.min(99, 40 + summary.percentage / 2)); // estimated

  const scoreGrade =
    summary.percentage >= 80 ? { label: "Excellent", color: "text-green-600 dark:text-green-400" } :
    summary.percentage >= 65 ? { label: "Good", color: "text-cyan-600 dark:text-cyan-400" } :
    summary.percentage >= 50 ? { label: "Average", color: "text-yellow-600 dark:text-yellow-400" } :
    { label: "Needs Work", color: "text-red-600 dark:text-red-400" };

  return (
    <div className="container py-10 space-y-6 max-w-5xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400 font-medium">Results</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight">{summary.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Completed in {formatTime(summary.durationSeconds)} ·{" "}
            <span className={cn("font-medium", scoreGrade.color)}>{scoreGrade.label}</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" asChild><Link href={`/test/${summary.testId}`}><RotateCcw className="h-4 w-4" /> Retake</Link></Button>
          <Button variant="outline" asChild><Link href="/analytics"><BarChart2 className="h-4 w-4" /> Analytics</Link></Button>
          <Button asChild><Link href="/mock-tests">Try Another</Link></Button>
        </div>
      </motion.div>

      {/* Headline scores */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <ScoreCard icon={<Trophy className="h-5 w-5" />} label="Score" value={`${summary.score}/${summary.maxScore}`} color="text-orange-600 dark:text-orange-400" />
        <ScoreCard icon={<Sparkles className="h-5 w-5" />} label="Percentage" value={`${summary.percentage}%`} color="text-cyan-600 dark:text-cyan-400" />
        <ScoreCard icon={<Target className="h-5 w-5" />} label="Accuracy" value={`${summary.accuracy}%`} color="text-purple-600 dark:text-purple-400" />
        <ScoreCard icon={<Timer className="h-5 w-5" />} label="Est. Percentile" value={`${Math.round(percentile)}`} color="text-blue-600 dark:text-blue-400" suffix="tile" />
      </motion.div>

      <div className="grid md:grid-cols-3 gap-3">
        <StatPill icon={<CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />} label="Correct" value={summary.correct} />
        <StatPill icon={<XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />} label="Incorrect" value={summary.incorrect} />
        <StatPill icon={<MinusCircle className="h-4 w-4 text-muted-foreground" />} label="Unanswered" value={summary.unanswered} />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Bar chart */}
        <Card className="p-6">
          <h3 className="font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />Subject-wise Accuracy</h3>
          <p className="text-xs text-muted-foreground mt-1">Correct answers as % of questions per subject.</p>
          <div className="h-52 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis dataKey="subject" stroke={chart.axis} fontSize={11} />
                <YAxis stroke={chart.axis} fontSize={11} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: chart.tooltipBg, border: `1px solid ${chart.tooltipBorder}`, borderRadius: 8, color: chart.tooltipText }}
                  labelStyle={{ color: chart.tooltipText }}
                  formatter={(val, name) => [`${val}%`, "Accuracy"]}
                />
                <Bar dataKey="accuracy" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Radar chart */}
        {radarData.length >= 3 && (
          <Card className="p-6">
            <h3 className="font-semibold flex items-center gap-2"><Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />Performance Radar</h3>
            <p className="text-xs text-muted-foreground mt-1">Overall strength across all subjects.</p>
            <div className="h-52 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke={chart.grid} />
                  <PolarAngleAxis dataKey="subject" stroke={chart.axis} fontSize={10} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={chart.grid} fontSize={9} />
                  <Radar name="Accuracy" dataKey="score" stroke="#a855f7" fill="#a855f7" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      {/* Weak areas */}
      {weakSubjects.length > 0 && (
        <Card className="p-6 border-orange-500/20 bg-orange-500/[0.03]">
          <h3 className="font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            Areas for Improvement
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Subjects where your accuracy is below 60% — focus practice here.
          </p>
          <div className="mt-4 space-y-3">
            {weakSubjects.map(([subject, data]) => {
              const d = data as any;
              return (
              <div key={subject} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-28">
                  <BookOpen className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                  <span className="text-sm font-medium">{subject}</span>
                </div>
                <div className="flex-1 h-2 rounded-full bg-slate-900/[0.06] dark:bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400 transition-all" style={{ width: `${d.accuracy}%` }} />
                </div>
                <span className={cn("text-sm font-mono tabular-nums w-12 text-right", d.accuracy < 40 ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400")}>{d.accuracy}%</span>
                <span className="text-xs text-muted-foreground hidden md:block">{d.correct}/{d.total} correct</span>
              </div>
            );})}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-slate-900/[0.02] border border-slate-200 dark:bg-white/[0.02] dark:border-white/[0.06]">
            <p className="text-xs text-muted-foreground">
              💡 <strong className="text-foreground">Tip:</strong> Use the subject-wise practice tests to isolate and strengthen weak areas. Aim for at least 70% accuracy before the full mock.
            </p>
          </div>
        </Card>
      )}

      {/* Per-subject breakdown table */}
      <Card className="p-6">
        <h3 className="font-semibold">Subject Breakdown</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-slate-200 dark:border-white/[0.06]">
                <th className="text-left pb-2">Subject</th>
                <th className="text-right pb-2">Correct</th>
                <th className="text-right pb-2">Wrong</th>
                <th className="text-right pb-2">Skipped</th>
                <th className="text-right pb-2">Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/[0.04]">
              {Object.entries(summary.bySubject).map(([subject, data]) => {
                const d = data as any;
                return (
                <tr key={subject}>
                  <td className="py-2.5 font-medium">{subject}</td>
                  <td className="py-2.5 text-right text-green-600 dark:text-green-400">{d.correct}</td>
                  <td className="py-2.5 text-right text-red-600 dark:text-red-400">{d.incorrect}</td>
                  <td className="py-2.5 text-right text-muted-foreground">{d.total - d.correct - d.incorrect}</td>
                  <td className={cn("py-2.5 text-right font-mono", d.accuracy >= 70 ? "text-green-600 dark:text-green-400" : d.accuracy >= 50 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400")}>{d.accuracy}%</td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Answer Review */}
      <AnswerReview summary={summary as any} />
    </div>
  );
}

function AnswerReview({ summary }: { summary: any }) {
  const questions: any[] = summary.questions ?? [];
  const answers: Record<string, number | null> = summary.answers ?? {};

  const [filter, setFilter] = useState<"all" | "wrong" | "correct" | "skipped">("all");

  if (questions.length === 0) return null;

  const filteredQs = questions.filter((q: any) => {
    const user = answers[q.id];
    const isCorrect = user !== null && user !== undefined && Number(user) === q.correctIndex;
    const isSkipped = user === null || user === undefined;
    const isWrong = !isCorrect && !isSkipped;
    if (filter === "wrong") return isWrong;
    if (filter === "correct") return isCorrect;
    if (filter === "skipped") return isSkipped;
    return true;
  });

  const counts = {
    wrong: questions.filter(q => {
      const u = answers[q.id];
      return u !== null && u !== undefined && Number(u) !== q.correctIndex;
    }).length,
    correct: questions.filter(q => {
      const u = answers[q.id];
      return u !== null && u !== undefined && Number(u) === q.correctIndex;
    }).length,
    skipped: questions.filter(q => answers[q.id] === null || answers[q.id] === undefined).length,
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-cyan-600 dark:text-cyan-400" /> Answer Review
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your choice and the correct answer are shown for every question.
          </p>
        </div>
        {/* Filter Tabs */}
        <div className="flex gap-1 p-1 rounded-lg border border-slate-200 bg-slate-900/[0.02] text-xs flex-wrap dark:border-white/10 dark:bg-white/[0.02]">
          {([
            { key: "all", label: `All (${questions.length})`, color: "" },
            { key: "wrong", label: `Wrong (${counts.wrong})`, color: "text-red-600 dark:text-red-400" },
            { key: "correct", label: `Correct (${counts.correct})`, color: "text-green-600 dark:text-green-400" },
            { key: "skipped", label: `Skipped (${counts.skipped})`, color: "text-muted-foreground" },
          ] as { key: "all" | "wrong" | "correct" | "skipped"; label: string; color: string }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "px-2.5 py-1 rounded-md transition",
                filter === tab.key ? "bg-slate-900/[0.08] dark:bg-white/[0.10] text-foreground" : `text-muted-foreground hover:text-foreground ${tab.color ?? ""}`
              )}
            >{tab.label}</button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {filteredQs.map((q: any, i: number) => {
          const user = answers[q.id];
          const isCorrect = user !== null && user !== undefined && Number(user) === q.correctIndex;
          const isSkipped = user === null || user === undefined;
          const isWrong = !isCorrect && !isSkipped;
          const qIndex = questions.indexOf(q);

          return (
            <div
              key={q.id}
              className={cn(
                "rounded-xl border overflow-hidden",
                isCorrect ? "border-green-400/25 bg-green-500/[0.04]"
                  : isWrong ? "border-red-400/25 bg-red-500/[0.04]"
                  : "border-slate-200 bg-slate-900/[0.02] dark:border-white/[0.07] dark:bg-white/[0.02]"
              )}
            >
              {/* Header row */}
              <div className="w-full text-left px-4 py-3 flex items-start gap-3">
                {/* Status badge */}
                <span className={cn(
                  "shrink-0 mt-0.5 h-6 w-6 rounded-md text-xs font-bold inline-flex items-center justify-center",
                  isCorrect ? "bg-green-500/25 text-green-700 dark:text-green-300"
                    : isWrong ? "bg-red-500/25 text-red-700 dark:text-red-300"
                    : "bg-slate-900/[0.05] dark:bg-white/[0.07] text-muted-foreground"
                )}>{qIndex + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{q.subject}</span>
                    {isCorrect && <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">✓ Correct</span>}
                    {isWrong && <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">✗ Wrong</span>}
                    {isSkipped && <span className="text-[10px] text-muted-foreground font-medium">— Skipped</span>}
                  </div>
                  <p className="text-sm mt-0.5">{q.text}</p>
                </div>
              </div>

              {/* Options — always visible */}
              <div className="px-4 pb-4 space-y-2 border-t border-slate-200 dark:border-white/[0.06] pt-3">
                <div className="grid gap-1.5">
                  {(q.options as string[]).map((opt: string, oi: number) => {
                    const isThisCorrect = oi === q.correctIndex;
                    const isThisUser = oi === Number(user);
                    const isUserWrongHere = isWrong && isThisUser;
                    return (
                      <div
                        key={oi}
                        className={cn(
                          "rounded-lg border px-3 py-2.5 text-sm flex items-start gap-2",
                          isThisCorrect
                            ? "border-green-400/50 bg-green-500/15 text-green-800 dark:text-green-100"
                            : isUserWrongHere
                            ? "border-red-400/50 bg-red-500/15 text-red-800 dark:text-red-200"
                            : "border-slate-200 dark:border-white/[0.06] text-muted-foreground"
                        )}
                      >
                        <span className={cn(
                          "shrink-0 font-semibold w-5 text-xs mt-0.5",
                          isThisCorrect ? "text-green-600 dark:text-green-400" : isUserWrongHere ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                        )}>
                          {String.fromCharCode(65 + oi)}.
                        </span>
                        <span className="flex-1">{opt}</span>
                        <span className="shrink-0 text-xs font-medium">
                          {isThisCorrect && <span className="text-green-600 dark:text-green-400">✓ Answer</span>}
                          {isUserWrongHere && <span className="text-red-600 dark:text-red-400">✗ Your choice</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {q.explanation && (
                  <div className="mt-3 p-3 rounded-lg bg-cyan-500/[0.06] border border-cyan-400/20">
                    <p className="text-xs"><span className="text-cyan-600 dark:text-cyan-400 font-semibold">Explanation: </span><span className="text-muted-foreground">{q.explanation}</span></p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ScoreCard({ icon, label, value, color, suffix }: {
  icon: React.ReactNode; label: string; value: string; color: string; suffix?: string;
}) {
  return (
    <Card className="p-5">
      <div className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900/[0.03] border border-slate-200 dark:bg-white/[0.04] dark:border-white/10", color)}>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{label}{suffix ? ` · ${suffix}` : ""}</p>
    </Card>
  );
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="glass rounded-xl px-4 py-3 flex items-center gap-3">
      {icon}
      <div>
        <p className="text-lg font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
