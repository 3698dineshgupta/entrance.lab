import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserSummaries } from "@/lib/analytics";
import { getUserPracticeReadiness } from "@/lib/practice-data";
import { AnalyticsClient } from "./analytics-client";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  const [summaries, readiness] = session
    ? await Promise.all([getUserSummaries(session.user.id), getUserPracticeReadiness(session.user.id)])
    : [[], []];
  return <AnalyticsClient initialSummaries={summaries} readiness={readiness} />;
}
