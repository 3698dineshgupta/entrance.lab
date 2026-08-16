"use client";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { AttemptSummary } from "@/lib/types";
import { ExamReadiness } from "@/lib/practice-data";
import { getTrendData, getWeakSubjects, getStreakData } from "@/lib/analytics-helpers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  BarChart, Bar, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import {
  TrendingUp, Target, Trophy, BookOpen, Flame, Play, AlertCircle,
  CheckCircle2, BarChart2, Zap, Clock, GraduationCap, ArrowRight, CircleDashed,
} from "lucide-react";

const SUBJECT_COLORS: Record<string, string> = {
  Physics: "#22d3ee",
  Chemistry: "#a855f7",
  Botany: "#4ade80",
  Zoology: "#fb923c",
  Mathematics: "#f59e0b",
  English: "#ec4899",
  MAT: "#f43f5e",
};

export function AnalyticsClient({ initialSummaries, readiness }: { initialSummaries: AttemptSummary[]; readiness: ExamReadiness[] }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const chart = {
    grid: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.08)",
    axis: isDark ? "rgba(255,255,255,0.4)" : "rgba(15,23,42,0.5)",
    tooltipBg: isDark ? "#0f172a" : "#ffffff",
    tooltipBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)",
    tooltipText: isDark ? "#f1f5f9" : "#0f172a",
  };
  const [examFilter, setExamFilter] = useState<string>("ALL");
  const [summaries, setSummaries] = useState<AttemptSummary[]>(initialSummaries);
  const [loading, setLoading] = useState(false);
  // Track if we've already loaded data for a given filter to avoid refetch
  const loadedFilters = useRef<Set<string>>(new Set(["ALL"]));

  // Only re-fetch when filter changes AND we haven't loaded it yet
  const fetchSummaries = useCallback(async (filter: string) => {
    if (loadedFilters.current.has(filter)) return; // skip if already loaded
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?exam=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setSummaries(data);
        loadedFilters.current.add(filter);
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchSummaries(examFilter);
  }, [examFilter, fetchSummaries]);

  const filtered = summaries;

  const trend = useMemo(() => getTrendData(filtered), [filtered]);
  const weak = useMemo(() => getWeakSubjects(filtered), [filtered]);
  const streaks = useMemo(() => getStreakData(filtered), [filtered]);

  const totalQPracticed = filtered.reduce((s, a) => s + a.total, 0);
  const avgScore = filtered.length > 0
    ? Math.round(filtered.reduce((s, a) => s + a.percentage, 0) / filtered.length)
    : 0;
  const bestScore = filtered.length > 0 ? Math.max(...filtered.map((s) => s.percentage)) : 0;

  const subjectAgg = useMemo(() => {
    const agg: Record<string, { correct: number; total: number }> = {};
    for (const s of filtered) {
      for (const [subj, data] of Object.entries(s.bySubject)) {
        agg[subj] ??= { correct: 0, total: 0 };
        agg[subj].correct += data.correct;
        agg[subj].total += data.total;
      }
    }
    return Object.entries(agg).map(([subject, d]) => ({
      subject,
      accuracy: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0,
      correct: d.correct,
      total: d.total,
    }));
  }, [filtered]);

  const latestSummary = filtered[filtered.length - 1];
  const radarData = latestSummary
    ? Object.entries(latestSummary.bySubject).map(([subject, d]) => ({
        subject, score: d.accuracy, fullMark: 100,
      }))
    : [];

  const hasReadinessData = readiness.some((r) => r.attempted > 0);

  if (summaries.length === 0 && !loading && !hasReadinessData) {
    return (
      <div className="container py-24 text-center max-w-lg mx-auto">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-400/20 mb-6">
          <BarChart2 className="h-8 w-8 text-cyan-700 dark:text-cyan-400" />
        </div>
        <h1 className="text-2xl font-semibold">No activity yet</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Practice a topic or complete a mock test to see your analytics here.
        </p>
        <div className="mt-6 flex gap-2 justify-center">
          <Button asChild>
            <Link href="/practice"><BookOpen className="h-4 w-4" /> Start Practicing</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/mock-tests"><Play className="h-4 w-4" /> Start a Test</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10 space-y-6 max-w-6xl relative">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-start justify-center pt-32 bg-background/60 backdrop-blur-sm rounded-xl">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-600 dark:border-cyan-400 border-t-transparent" />
            Updating analytics...
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-400 font-medium">Performance Analytics</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight">Your Progress</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {filtered.length} test{filtered.length !== 1 ? "s" : ""} completed · {totalQPracticed} questions practiced
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex gap-1 p-1 rounded-lg border border-slate-200 bg-slate-900/[0.02] dark:border-white/10 dark:bg-white/[0.02]">
            {(["ALL", "IOE", "CEE"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setExamFilter(f)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-md transition",
                  examFilter === f ? "bg-white shadow-sm text-foreground dark:bg-white/[0.08] dark:shadow-none" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f === "ALL" ? "All Exams" : f}
              </button>
            ))}
          </div>
          <Button asChild size="sm">
            <Link href="/mock-tests"><Play className="h-3.5 w-3.5" /> New test</Link>
          </Button>
        </div>
      </div>

      {/* Mock test readiness, based on practice coverage + accuracy */}
      <PracticeReadinessSection readiness={readiness} />

      {summaries.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-400/20 mb-3">
            <BarChart2 className="h-6 w-6 text-cyan-700 dark:text-cyan-400" />
          </div>
          <h3 className="font-semibold">No mock test attempts yet</h3>
          <p className="text-muted-foreground mt-1.5 text-sm max-w-sm mx-auto">
            Score trends, subject accuracy, and attempt history will show up here once you complete a mock test.
          </p>
          <Button asChild className="mt-5" size="sm">
            <Link href="/mock-tests"><Play className="h-3.5 w-3.5" /> Start a Test</Link>
          </Button>
        </Card>
      ) : (
      <>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={<Trophy className="h-5 w-5" />} label="Best Score" value={`${bestScore}%`} color="text-orange-600 dark:text-orange-400" sub={`across ${filtered.length} tests`} />
        <KpiCard icon={<Target className="h-5 w-5" />} label="Average Score" value={`${avgScore}%`} color="text-cyan-700 dark:text-cyan-400" sub="all attempts" />
        <KpiCard icon={<Flame className="h-5 w-5" />} label="Best Streak" value={`${streaks.best}`} color="text-red-600 dark:text-red-400" sub="consecutive passes" />
        <KpiCard icon={<BookOpen className="h-5 w-5" />} label="Questions Done" value={`${totalQPracticed}`} color="text-green-600 dark:text-green-400" sub="total practiced" />
      </div>

      {/* Score trend */}
      {trend.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cyan-700 dark:text-cyan-400" /> Score Trend
          </h3>
          <div className="h-60 mt-5">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis dataKey="label" stroke={chart.axis} fontSize={11} />
                <YAxis stroke={chart.axis} fontSize={11} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: chart.tooltipBg, border: `1px solid ${chart.tooltipBorder}`, borderRadius: 8, fontSize: 12, color: chart.tooltipText }}
                  labelStyle={{ color: chart.tooltipText }}
                  formatter={(val: number) => [`${val}%`, ""]}
                  labelFormatter={(label) => label}
                />
                <Line type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={2.5} dot={{ fill: "#22d3ee", r: 4 }} name="score" />
                <Line type="monotone" dataKey="accuracy" stroke="#a855f7" strokeWidth={2} dot={{ fill: "#a855f7", r: 3 }} strokeDasharray="4 2" name="accuracy" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2 justify-end text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-6 rounded bg-cyan-400 inline-block" /> Score %</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-6 rounded bg-purple-400 inline-block opacity-60" /> Accuracy %</span>
          </div>
        </Card>
      )}

      {/* Subject accuracy + Radar */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400" /> Subject Accuracy (All Time)
          </h3>
          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectAgg} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke={chart.axis} fontSize={11} unit="%" />
                <YAxis type="category" dataKey="subject" stroke={chart.axis} fontSize={11} width={70} />
                <Tooltip
                  contentStyle={{ background: chart.tooltipBg, border: `1px solid ${chart.tooltipBorder}`, borderRadius: 8, fontSize: 12, color: chart.tooltipText }}
                  labelStyle={{ color: chart.tooltipText }}
                  formatter={(val: number) => [`${val}%`, "Accuracy"]}
                />
                <Bar dataKey="accuracy" radius={[0, 6, 6, 0]}>
                  {subjectAgg.map((entry) => (
                    <Cell key={entry.subject} fill={SUBJECT_COLORS[entry.subject] ?? "#6366f1"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {radarData.length >= 3 && (
          <Card className="p-6">
            <h3 className="font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" /> Latest Attempt — Radar
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {latestSummary && new Date(latestSummary.date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </p>
            <div className="h-56 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke={chart.grid} />
                  <PolarAngleAxis dataKey="subject" stroke={chart.axis} fontSize={10} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={chart.grid} fontSize={9} />
                  <Radar name="Accuracy %" dataKey="score" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      {/* Weak areas */}
      {weak.length > 0 && (
        <Card className="p-6 border-orange-500/20 bg-orange-500/[0.02]">
          <h3 className="font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" /> Focus Areas
          </h3>
          <div className="mt-4 space-y-3">
            {weak.map((w, i) => (
              <div key={w.subject} className="flex items-center gap-3">
                <span className={cn("text-xs font-mono w-4", i < 3 ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground")}>{i + 1}</span>
                <span className="text-sm font-medium w-24 shrink-0">{w.subject}</span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all",
                      w.accuracy < 40 ? "bg-gradient-to-r from-red-600 to-red-400"
                        : w.accuracy < 60 ? "bg-gradient-to-r from-orange-600 to-orange-400"
                        : "bg-gradient-to-r from-yellow-600 to-yellow-400"
                    )}
                    style={{ width: `${w.accuracy}%` }}
                  />
                </div>
                <span className={cn("text-sm font-mono w-12 text-right",
                  w.accuracy < 40 ? "text-red-600 dark:text-red-400" : w.accuracy < 60 ? "text-orange-600 dark:text-orange-400" : "text-yellow-600 dark:text-yellow-400"
                )}>{w.accuracy}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Attempt history table */}
      <Card className="p-6">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" /> Attempt History
        </h3>
        <div className="-mx-4 sm:mx-0 overflow-x-auto px-4 sm:px-0 mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-slate-200 dark:border-white/[0.06]">
                <th className="text-left pb-2 pr-4 hidden sm:table-cell">#</th>
                <th className="text-left pb-2 pr-4">Test</th>
                <th className="text-left pb-2 pr-4">Date</th>
                <th className="text-right pb-2 sm:pr-4">Score</th>
                <th className="text-right pb-2 pr-4 hidden sm:table-cell">Accuracy</th>
                <th className="text-right pb-2 hidden sm:table-cell">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {[...filtered].reverse().map((s, i) => (
                <tr key={s.attemptId}>
                  <td className="py-2.5 pr-4 text-muted-foreground hidden sm:table-cell">{filtered.length - i}</td>
                  <td className="py-2.5 pr-4 max-w-[120px] sm:max-w-[200px] truncate font-medium">{s.title}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground text-[10px] sm:text-xs">
                    {new Date(s.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "2-digit" })}
                  </td>
                  <td className="py-2.5 sm:pr-4 text-right font-mono text-xs sm:text-sm">
                    <span className={cn(s.percentage >= 50 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400")}>{s.score}</span>
                    <span className="text-muted-foreground">/{s.maxScore}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-right font-mono hidden sm:table-cell">{s.accuracy}%</td>
                  <td className="py-2.5 text-right hidden sm:table-cell">
                    {s.percentage >= 50
                      ? <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-400 ml-auto" />
                      : <AlertCircle className="h-4 w-4 text-red-700 dark:text-red-400 ml-auto" />
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      </>
      )}
    </div>
  );
}

function PracticeReadinessSection({ readiness }: { readiness: ExamReadiness[] }) {
  const active = readiness.filter((r) => r.total > 0);
  if (active.length === 0) return null;

  return (
    <Card className="p-6">
      <h3 className="font-semibold flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-cyan-700 dark:text-cyan-400" /> Mock Test Readiness
      </h3>
      <p className="text-xs text-muted-foreground mt-1">
        How much of each subject's practice bank you've covered, and how accurately — a rough guide to
        whether you're ready to attempt a timed mock test.
      </p>

      <div className="mt-5 grid md:grid-cols-2 gap-4">
        {active.map((examReadiness) => (
          <ExamReadinessCard key={examReadiness.exam} data={examReadiness} />
        ))}
      </div>
    </Card>
  );
}

function ExamReadinessCard({ data }: { data: ExamReadiness }) {
  const verdict = data.attempted === 0
    ? { label: "Not started", color: "text-muted-foreground", bg: "bg-slate-900/[0.02] border-slate-200 dark:bg-white/[0.02] dark:border-white/10", icon: CircleDashed }
    : data.ready
    ? { label: "Ready for mock test", color: "text-green-700 dark:text-green-400", bg: "bg-green-500/[0.06] border-green-400/20", icon: CheckCircle2 }
    : { label: "Keep practicing", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-500/[0.06] border-amber-400/20", icon: AlertCircle };
  const Icon = verdict.icon;

  return (
    <div className={cn("rounded-xl border p-4", verdict.bg)}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{data.exam}</p>
          <p className={cn("mt-0.5 text-sm font-semibold flex items-center gap-1.5", verdict.color)}>
            <Icon className="h-4 w-4" /> {verdict.label}
          </p>
        </div>
        <Button asChild size="sm" variant={data.ready ? "default" : "secondary"}>
          <Link href={data.ready ? "/mock-tests" : "/practice"}>
            {data.ready ? "Take mock test" : "Practice"} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="flex justify-between mb-1"><span className="text-muted-foreground">Coverage</span><span className="font-mono">{data.coverage}%</span></div>
          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${data.coverage}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1"><span className="text-muted-foreground">Accuracy</span><span className="font-mono">{data.accuracy}%</span></div>
          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
            <div
              className={cn("h-full", data.accuracy >= 60 ? "bg-green-400" : data.accuracy >= 40 ? "bg-amber-400" : "bg-red-400")}
              style={{ width: `${data.accuracy}%` }}
            />
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">{data.attempted}/{data.total} questions practiced</p>

      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/[0.06] space-y-2">
        {data.subjects.map((s) => (
          <div key={s.subject} className="flex items-center gap-2 text-xs">
            <span className="w-20 shrink-0 truncate">{s.subject}</span>
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
              <div
                className={cn(
                  "h-full",
                  s.status === "ready" ? "bg-green-400"
                    : s.status === "in-progress" ? "bg-cyan-400"
                    : s.status === "started" ? "bg-amber-400"
                    : "bg-slate-300 dark:bg-white/10"
                )}
                style={{ width: `${s.coverage}%` }}
              />
            </div>
            <span className="w-9 shrink-0 text-right font-mono text-muted-foreground">{s.coverage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, color, sub }: {
  icon: React.ReactNode; label: string; value: string; color: string; sub: string;
}) {
  return (
    <Card className="p-5">
      <div className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900/[0.03] border border-slate-200 dark:bg-white/[0.04] dark:border-white/10", color)}>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-xs font-medium text-foreground">{label}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </Card>
  );
}
