import { Hero } from "@/components/hero";
import { StatsSection } from "@/components/stats-section";
import { ExamCards } from "@/components/exam-cards";

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsSection />
      <ExamCards />
    </>
  );
}
