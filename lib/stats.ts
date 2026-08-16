import { prisma } from "@/lib/prisma";
import { fetchWithCache } from "@/lib/redis";

export type HomeStats = {
  students: number;
  mockTests: number;
  questions: number;
  attempts: number;
};

// Homepage stats are read-heavy and public — cache for 15 minutes so every
// visitor doesn't trigger four COUNT queries. Returns null (never zeros) on
// failure so the UI can hide the section instead of showing fake "0+" cards.
export async function getHomeStats(): Promise<HomeStats | null> {
  try {
    return await fetchWithCache<HomeStats>(
      "home:stats",
      async () => {
        const [students, mockTests, questions, attempts] = await Promise.all([
          prisma.user.count(),
          prisma.testSet.count(),
          prisma.question.count(),
          prisma.attempt.count(),
        ]);
        return { students, mockTests, questions, attempts };
      },
      900
    );
  } catch (error) {
    console.error("[HomeStats] Failed to load homepage stats:", error);
    return null;
  }
}
