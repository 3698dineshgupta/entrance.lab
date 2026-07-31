import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserSummaries } from "@/lib/analytics";
import { AnalyticsClient } from "./analytics-client";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  const summaries = session ? await getUserSummaries(session.user.id) : [];
  return <AnalyticsClient initialSummaries={summaries} />;
}
