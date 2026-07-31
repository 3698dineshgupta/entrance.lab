import { AttemptSummary } from "./types";

// These are pure computation helpers — no DB/Redis imports, safe to use in client components.

export function getTrendData(summaries: AttemptSummary[]) {
  return summaries.map((s, i) => ({
    attempt: i + 1,
    label: new Date(s.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    score: s.percentage,
    accuracy: s.accuracy,
    title: s.title,
  }));
}

export function getWeakSubjects(summaries: AttemptSummary[]) {
  const agg: Record<string, { correct: number; total: number }> = {};
  for (const s of summaries) {
    for (const [subject, data] of Object.entries(s.bySubject)) {
      agg[subject] ??= { correct: 0, total: 0 };
      agg[subject].correct += data.correct;
      agg[subject].total += data.total;
    }
  }
  return Object.entries(agg)
    .map(([subject, d]) => ({
      subject,
      accuracy: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0,
      correct: d.correct,
      total: d.total,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);
}

export function getStreakData(summaries: AttemptSummary[]) {
  let best = 0, current = 0;
  for (const s of summaries) {
    if (s.percentage >= 50) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return { best, current };
}
