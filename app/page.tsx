import { Hero } from "@/components/hero";
import { StatsSection } from "@/components/stats-section";
import { ExamCards } from "@/components/exam-cards";
import { HowItWorks } from "@/components/home/how-it-works";
import { MockPreview } from "@/components/home/mock-preview";
import { FeaturesGrid } from "@/components/home/features-grid";
import { CtaSection } from "@/components/home/cta-section";
import { getHomeStats } from "@/lib/stats";

export default async function HomePage() {
  const stats = await getHomeStats();

  return (
    <>
      <Hero questionCount={stats?.questions ?? null} mockTestCount={stats?.mockTests ?? null} />
      {stats && <StatsSection data={stats} />}
      <ExamCards />
      <HowItWorks />
      <MockPreview />
      <FeaturesGrid />
      <CtaSection />
    </>
  );
}
