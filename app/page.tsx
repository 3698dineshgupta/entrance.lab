import { Hero } from "@/components/hero";
import { StatsSection } from "@/components/stats-section";
import { ExamCards } from "@/components/exam-cards";
import { MobileFloatingNav } from "@/components/mobile-floating-nav";

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsSection />
      <ExamCards />
      <div className="h-24 md:hidden" />
      <MobileFloatingNav />
    </>
  );
}
