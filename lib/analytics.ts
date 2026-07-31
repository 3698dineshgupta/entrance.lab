import { prisma } from "./prisma";
import { AttemptSummary, ExamType } from "./types";

import { fetchWithCache } from "./redis";

// ─── Summary computation ──────────────────────────────────────────────────────

export async function getUserSummaries(userId: string, examFilter?: string): Promise<AttemptSummary[]> {
  const cacheKey = `user_summaries_${userId}_${examFilter || "ALL"}`;

  const attempts = await fetchWithCache(
    cacheKey,
    async () => {
      return await prisma.attempt.findMany({
        where: { 
          userId,
          ...(examFilter && examFilter !== "ALL" ? { testSet: { exam: examFilter } } : {})
        },
        include: {
          testSet: {
            include: { questions: true }
          }
        },
        orderBy: { submittedAt: "asc" }
      });
    },
    300 // Cache analytics for 5 minutes
  );

  return attempts.map((attempt: any) => {
    const test = attempt.testSet;
    let correct = 0, incorrect = 0, unanswered = 0, score = 0;
    const bySubject: AttemptSummary["bySubject"] = {};
    
    // Prisma stores JSON, coerce to the right type
    const answers = (attempt.answers || {}) as Record<string, number | null>;

    for (const q of test.questions) {
      bySubject[q.subject] ??= { correct: 0, incorrect: 0, total: 0, accuracy: 0 };
      bySubject[q.subject].total += 1;

      const a = answers[q.id];
      if (a === null || a === undefined) {
        unanswered += 1;
      } else if (Number(a) === q.correctIndex) {
        correct += 1;
        score += q.marks;
        bySubject[q.subject].correct += 1;
      } else {
        incorrect += 1;
        score -= Number(q.negativeMarks ?? 0);
        bySubject[q.subject].incorrect += 1;
      }
    }

    for (const s of Object.values(bySubject)) {
      const attempted = s.correct + s.incorrect;
      s.accuracy = attempted > 0 ? Math.round((s.correct / attempted) * 100) : 0;
    }

    const total = test.questions.length;
    const maxScore = test.questions.reduce((s, q) => s + q.marks, 0);
    // Percentage: clamped to 0 minimum (negative marks can't make percentage go below 0%)
    const rawPercentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const percentage = Math.max(0, Math.round(rawPercentage));
    // Accuracy: how many of the ANSWERED questions were correct
    const accuracy = correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0;
    // Display score clamped to 0 (showing -2 is confusing)
    const displayScore = parseFloat(Math.max(0, score).toFixed(2));

    return {
      attemptId: attempt.id,
      testId: test.id,
      exam: test.exam as any,
      title: test.title,
      date: attempt.submittedAt.getTime(),
      score: displayScore,
      maxScore,
      percentage,
      accuracy,
      correct,
      incorrect,
      unanswered,
      total,
      durationSeconds: attempt.durationSeconds,
      bySubject,
    };
  });
}

// ─── Analytics helpers ────────────────────────────────────────────────────────

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
