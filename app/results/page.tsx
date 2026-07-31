"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AttemptSummary } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, XCircle, MinusCircle, Trophy, RotateCcw, Sparkles, Timer,
  Target, TrendingUp, AlertCircle, BarChart2, BookOpen
} from "lucide-react";
import { formatTime, cn } from "@/lib/utils";
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
      <div className="container py-24 text-center">
        <h1 className="text-2xl font-semibold">No recent attempt found</h1>
        <p className="text-muted-foreground mt-2 text-sm">Start a mock test to see your results here.</p>
        <Button asChild className="mt-6"><Link href="/mock-tests">Browse mock tests</Link></Button>
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
    summary.percentage >= 80 ? { label: "Excellent", color: "text-green-400" } :
    summary.percentage >= 65 ? { label: "Good", color: "text-cyan-400" } :
    summary.percentage >= 50 ? { label: "Average", color: "text-yellow-400" } :
    { label: "Needs Work", color: "text-red-400" };

  return (
    <div className="container py-10 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-medium">Results</p>
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
      </div>

      {/* Headline scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ScoreCard icon={<Trophy className="h-5 w-5" />} label="Score" value={`${summary.score}/${summary.maxScore}`} color="text-orange-400" />
        <ScoreCard icon={<Sparkles className="h-5 w-5" />} label="Percentage" value={`${summary.percentage}%`} color="text-cyan-400" />
        <ScoreCard icon={<Target className="h-5 w-5" />} label="Accuracy" value={`${summary.accuracy}%`} color="text-purple-400" />
        <ScoreCard icon={<Timer className="h-5 w-5" />} label="Est. Percentile" value={`${Math.round(percentile)}`} color="text-blue-400" suffix="tile" />
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <StatPill icon={<CheckCircle2 className="h-4 w-4 text-green-400" />} label="Correct" value={summary.correct} />
        <StatPill icon={<XCircle className="h-4 w-4 text-red-400" />} label="Incorrect" value={summary.incorrect} />
        <StatPill icon={<MinusCircle className="h-4 w-4 text-muted-foreground" />} label="Unanswered" value={summary.unanswered} />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Bar chart */}
        <Card className="p-6">
          <h3 className="font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-cyan-400" />Subject-wise Accuracy</h3>
          <p className="text-xs text-muted-foreground mt-1">Correct answers as % of questions per subject.</p>
          <div className="h-52 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="subject" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
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
            <h3 className="font-semibold flex items-center gap-2"><Target className="h-4 w-4 text-purple-400" />Performance Radar</h3>
            <p className="text-xs text-muted-foreground mt-1">Overall strength across all subjects.</p>
            <div className="h-52 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" stroke="rgba(255,255,255,0.5)" fontSize={10} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.2)" fontSize={9} />
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
            <AlertCircle className="h-4 w-4 text-orange-400" />
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
                  <BookOpen className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                  <span className="text-sm font-medium">{subject}</span>
                </div>
                <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400 transition-all" style={{ width: `${d.accuracy}%` }} />
                </div>
                <span className={cn("text-sm font-mono tabular-nums w-12 text-right", d.accuracy < 40 ? "text-red-400" : "text-orange-400")}>{d.accuracy}%</span>
                <span className="text-xs text-muted-foreground hidden md:block">{d.correct}/{d.total} correct</span>
              </div>
            );})}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
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
              <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-white/[0.06]">
                <th className="text-left pb-2">Subject</th>
                <th className="text-right pb-2">Correct</th>
                <th className="text-right pb-2">Wrong</th>
                <th className="text-right pb-2">Skipped</th>
                <th className="text-right pb-2">Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {Object.entries(summary.bySubject).map(([subject, data]) => {
                const d = data as any;
                return (
                <tr key={subject}>
                  <td className="py-2.5 font-medium">{subject}</td>
                  <td className="py-2.5 text-right text-green-400">{d.correct}</td>
                  <td className="py-2.5 text-right text-red-400">{d.incorrect}</td>
                  <td className="py-2.5 text-right text-muted-foreground">{d.total - d.correct - d.incorrect}</td>
                  <td className={cn("py-2.5 text-right font-mono", d.accuracy >= 70 ? "text-green-400" : d.accuracy >= 50 ? "text-yellow-400" : "text-red-400")}>{d.accuracy}%</td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Answer review */}
      <Card className="p-6">
        <h3 className="font-semibold">Answer Review</h3>
        <p className="text-xs text-muted-foreground">Every question with the correct answer and explanation.</p>
        <div className="mt-4 space-y-3">
          {(summary as any).questions?.map((q: any, i: number) => {
            const user = (summary as any).answers[q.id];
            const isCorrect = user === q.correctIndex;
            const isUnanswered = user === null || user === undefined;
            return (
              <div key={q.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                <div className="flex items-start gap-3">
                  <span className={cn(
                    "shrink-0 mt-0.5 h-6 w-6 rounded-md text-xs font-semibold inline-flex items-center justify-center",
                    isUnanswered ? "bg-white/[0.06] text-muted-foreground"
                      : isCorrect ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                  )}>{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground mb-1">{q.subject}</p>
                    <p className="text-sm">{q.text}</p>
                    <div className="mt-3 grid gap-1.5 text-xs">
                      {(q.options as string[]).map((o: string, oi: number) => (
                        <div
                          key={oi}
                          className={cn(
                            "rounded-md border px-3 py-2",
                            oi === q.correctIndex
                              ? "border-green-400/40 bg-green-500/10 text-green-200"
                              : oi === user
                                ? "border-red-400/40 bg-red-500/10 text-red-200"
                                : "border-white/[0.06]"
                          )}
                        >
                          <span className="text-muted-foreground mr-2">{String.fromCharCode(65 + oi)}.</span>{o}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <p className="mt-3 text-xs text-muted-foreground border-l-2 border-cyan-400/40 pl-3">
                        <span className="text-foreground font-medium">Explanation:</span> {q.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function ScoreCard({ icon, label, value, color, suffix }: {
  icon: React.ReactNode; label: string; value: string; color: string; suffix?: string;
}) {
  return (
    <Card className="p-5">
      <div className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] border border-white/10", color)}>
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
