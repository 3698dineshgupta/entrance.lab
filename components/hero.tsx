'use client'
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { BrainScene } from "@/components/hero/brain-scene";
import { FeatureOrbit } from "@/components/hero/feature-orbit";
import { Spotlight } from "@/components/ui/spotlight";
import { Magnetic } from "@/components/ui/magnetic";
import { ExamSelectionModal } from "@/components/exam-selection-modal";
import { MobileHero } from "@/components/home/mobile-hero";
import { ExamType } from "@/lib/types";

export function Hero({
  questionCount,
  mockTestCount,
}: {
  questionCount: number | null;
  mockTestCount: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [exam, setExam] = useState<ExamType>("IOE");
  // The 3D brain scene pins the main thread with a permanent WebGL render
  // loop — fine on desktop, but makes every interaction on mobile (where
  // most traffic is) feel janky. Only mount it on wider viewports; the
  // right-hand column is hidden entirely on mobile, so text takes the full
  // card. Same gate that used to guard the Spline scene here.
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const prefersReducedMotion = useReducedMotion();

  const trustItems = [
    questionCount ? `${questionCount.toLocaleString()}+ Questions` : null,
    mockTestCount ? `${mockTestCount} Mock Tests` : null,
    "Real Exam Pattern",
  ].filter(Boolean) as string[];

  return (
    <section className="relative mx-auto w-full max-w-7xl px-4 py-5 sm:py-6 md:px-6 md:py-8">
      {/* Soft ambient glow — sits on the plain page background behind both
          columns, independent of any card. */}
      <div
        className="pointer-events-none absolute inset-x-4 -top-6 h-[420px] md:h-[600px] opacity-40 blur-3xl dark:opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(600px 300px at 30% 20%, rgba(79,107,255,0.28), transparent 60%), radial-gradient(500px 300px at 80% 60%, rgba(61,217,255,0.18), transparent 60%)",
        }}
        aria-hidden="true"
      />

      {/* Mobile-only hero — completely separate markup from the desktop
          layout below. */}
      <MobileHero questionCount={questionCount} mockTestCount={mockTestCount} />

      {/* Desktop layout: a plain grid, no shared border/card around both
          columns — the ONLY boundary in this section is the one wrapping
          the brain + badges on the right. */}
      <div className="hidden md:grid md:min-h-[560px] md:grid-cols-[48%_52%] items-center gap-6 lg:gap-10">
        {/* Left: content — sits directly on the page background, no card,
            theme-adaptive colors (this used to assume an always-black
            backdrop; now it needs to read on both light and dark). */}
        <div className="relative z-10 flex flex-col justify-center w-full text-left">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-[#4F6BFF]/25 bg-[#4F6BFF]/[0.06] px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-blue-700 dark:border-[#4F6BFF]/30 dark:bg-[#4F6BFF]/10 dark:text-[#8FB4FF]"
          >
            <Sparkles className="h-3 w-3" />
            The Next Generation of Exam Preparation
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="max-w-xl font-heading font-extrabold text-4xl leading-tight text-foreground md:text-5xl lg:text-[3.4rem] not-italic"
          >
            Prepare Smarter.
            <br />
            Practice Better.
            <br />
            <span className="text-gradient-animated">Crack Any Exam.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg md:leading-7"
          >
            Practise realistic IOE and CEE mock tests, improve your speed and
            understand your performance before the real exam.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-8 flex flex-row flex-wrap items-center gap-3 justify-start"
          >
            <Magnetic>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="btn-shine group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#4F6BFF] to-[#8B5CF6] px-6 py-3.5 text-base font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:brightness-110 hover:shadow-xl hover:shadow-[#8B5CF6]/40 whitespace-nowrap text-center shadow-lg shadow-[#4F6BFF]/25"
              >
                Start Practicing
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </Magnetic>
            <Magnetic strength={0.2}>
              <Link
                href="/mock-tests"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-slate-900/[0.03] px-6 py-3.5 text-base font-medium text-foreground transition-all duration-300 hover:scale-[1.02] hover:bg-slate-900/[0.06] hover:border-[#4F6BFF]/40 whitespace-nowrap text-center dark:border-white/15 dark:bg-white/[0.04] dark:text-white/90 dark:hover:bg-white/10"
              >
                Explore Mock Tests
              </Link>
            </Magnetic>
          </motion.div>

          {trustItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 flex flex-wrap justify-start items-center gap-5 text-xs text-muted-foreground"
            >
              {trustItems.map((item, i) => (
                <div key={item} className="flex items-center gap-5">
                  {i > 0 && <div className="hidden sm:block h-4 w-px bg-slate-300 dark:bg-white/10" />}
                  <span className="font-semibold text-foreground">{item}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Right: the ONE boundary in this section — rotating 3D "AI brain"
            + orbiting real-feature nodes, framed in the always-black
            showcase box. Hidden entirely on mobile (MobileHero covers
            mobile with its own lightweight visual). */}
        <div
          className="relative hidden md:block h-full min-h-[560px] overflow-hidden rounded-[20px] border border-white/10 bg-black shadow-2xl shadow-[#4F6BFF]/[0.08]"
          style={{
            // Hardcoded (not the theme-aware .grid-bg utility): this box is
            // intentionally always-black regardless of site theme.
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/20 via-black/50 to-black" />

          {/* Subtle drifting particles — GPU-cheap CSS transforms, no canvas */}
          {!prefersReducedMotion && (
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <span className="absolute left-[15%] top-[20%] h-1.5 w-1.5 rounded-full bg-cyan-300/40 blur-[1px] animate-drift" />
              <span className="absolute left-[38%] top-[12%] h-1 w-1 rounded-full bg-blue-300/40 blur-[1px] animate-drift-slow" />
              <span className="absolute left-[8%] top-[65%] h-1 w-1 rounded-full bg-violet-300/40 blur-[1px] animate-drift-slow" />
              <span className="absolute left-[55%] top-[78%] h-1.5 w-1.5 rounded-full bg-cyan-300/30 blur-[1px] animate-drift" />
              <span className="absolute left-[70%] top-[30%] h-1 w-1 rounded-full bg-white/30 blur-[1px] animate-drift-slow" />
            </div>
          )}

          <Spotlight className="left-1/4 -top-40" fill="white" />

          <div className="relative z-10 h-full w-full" style={{ touchAction: 'pan-y' }}>
            {isDesktop && (
              <>
                <BrainScene className="absolute inset-0 w-full h-full" />
                <FeatureOrbit />
              </>
            )}
          </div>
        </div>
      </div>

      <ExamSelectionModal open={open} onOpenChange={setOpen} defaultExam={exam} />
    </section>
  );
}
