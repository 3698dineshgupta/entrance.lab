import { prisma } from "@/lib/prisma";
import { fetchWithCache } from "@/lib/redis";
import { MockTestsClient } from "./mock-tests-client";

export const dynamic = "force-dynamic";

export default async function MockTestsPage() {
  const tests = await fetchWithCache(
    "published_mock_tests",
    async () => {
      return await prisma.testSet.findMany({
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          exam: true,
          mode: true,
          subject: true,
          difficulty: true,
          durationMinutes: true,
          createdAt: true,
          _count: { select: { questions: true } }
        },
        orderBy: { createdAt: "desc" }
      });
    },
    600 // cache for 10 minutes
  );

  return <MockTestsClient initialTests={tests as any} />;
}
