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
        select: {
          id: true,
          submittedAt: true,
          durationSeconds: true,
          answers: true,
          testSet: {
            select: {
              id: true,
              exam: true,
              title: true,
              questions: {
                select: {
                  id: true,
                  subject: true,
                  correctIndex: true,
                  marks: true,
                  negativeMarks: true,
                }
              }
            }
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
    const maxScore = test.questions.reduce((s: number, q: any) => s + (q.marks || 1), 0);
    // Percentage: clamped to 0 minimum (negative marks can't make percentage go below 0%)
    const rawPercentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const percentage = Math.max(0, Math.round(rawPercentage));
    // Accuracy: how many of the ANSWERED questions were correct
    const accuracy = correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0;
    // Display score clamped to 0 (showing -2 is confusing)
    const displayScore = parseFloat(Math.max(0, score).toFixed(2));

    const submittedAt = new Date(attempt.submittedAt);
    const date = submittedAt.getTime();

    return {
      attemptId: attempt.id,
      testId: test.id,
      exam: test.exam as any,
      title: test.title,
      date,
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

// Pure analytics helpers have been moved to lib/analytics-helpers.ts
// to keep this file server-only (it imports prisma + redis).
