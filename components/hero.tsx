'use client'
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useMotionValue, useReducedMotion } from "framer-motion";
import { ArrowRight, ListChecks, FileText, Sparkles } from "lucide-react";
import { SplineScene } from "@/components/ui/spline-scene";
import { Spotlight } from "@/components/ui/spotlight";
import { ExamSelectionModal } from "@/components/exam-selection-modal";
import { FloatingStatCard } from "@/components/home/floating-stat-card";
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
  // The Spline 3D scene pins the main thread at ~100% CPU continuously
  // (a permanent WebGL render loop) — fine on desktop, but makes every
  // interaction on mobile (where most traffic is) feel janky. Only mount it
  // on wider viewports; the right-hand column is hidden entirely on mobile
  // (see the `hidden md:flex` column below), so text takes the full card.
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    mouseY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
  };
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const trustItems = [
    questionCount ? `${questionCount.toLocaleString()}+ Questions` : null,
    mockTestCount ? `${mockTestCount} Mock Tests` : null,
    "Real Exam Pattern",
  ].filter(Boolean) as string[];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-5 sm:py-6 md:px-6 md:py-8">
      {/* Mobile-only hero — completely separate markup from the desktop card
          below (not the same JSX with mobile classes threaded through it),
          so the desktop block below is guaranteed pixel-identical to before. */}
      <MobileHero questionCount={questionCount} mockTestCount={mockTestCount} />

      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="hidden md:block relative md:min-h-[560px] overflow-hidden rounded-[20px] border border-white/10 bg-black shadow-2xl"
        style={{
          // Hardcoded (not the theme-aware .grid-bg utility): this card is
          // intentionally always-black regardless of site theme, so its grid
          // lines must always be the light-on-black variant.
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black md:bg-gradient-to-r md:from-black/20 md:via-black/60 md:to-black" />

        {/* Subtle drifting particles — desktop only, GPU-cheap CSS transforms, no canvas */}
        {!prefersReducedMotion && (
          <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden="true">
            <span className="absolute left-[15%] top-[20%] h-1.5 w-1.5 rounded-full bg-cyan-300/40 blur-[1px] animate-drift" />
            <span className="absolute left-[38%] top-[12%] h-1 w-1 rounded-full bg-blue-300/40 blur-[1px] animate-drift-slow" />
            <span className="absolute left-[8%] top-[65%] h-1 w-1 rounded-full bg-violet-300/40 blur-[1px] animate-drift-slow" />
            <span className="absolute left-[55%] top-[78%] h-1.5 w-1.5 rounded-full bg-cyan-300/30 blur-[1px] animate-drift" />
            <span className="absolute left-[70%] top-[30%] h-1 w-1 rounded-full bg-white/30 blur-[1px] animate-drift-slow" />
          </div>
        )}

        <Spotlight
          className="-left-20 -top-40 md:left-20 md:-top-28"
          fill="white"
        />

        <div className="relative z-10 flex flex-col md:grid md:grid-cols-[48%_52%] md:min-h-[560px] items-center">
          {/* Left: content — full width on mobile since there's no 3D column there */}
          <div className="flex flex-col justify-center w-full px-5 sm:px-6 md:px-12 lg:px-16 py-6 sm:py-7 md:py-12 z-20 text-left">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-2 md:mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-blue-400/20 bg-blue-500/[0.06] px-3 py-1 text-[10px] sm:text-[11px] md:text-xs font-medium uppercase tracking-[0.14em] text-blue-300"
            >
              <Sparkles className="h-3 w-3" />
              The Next Generation of Exam Preparation
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="max-w-xl text-2xl sm:text-3xl font-bold leading-tight text-white md:text-5xl lg:text-6xl not-italic"
            >
              Master Your
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-violet-400">Entrance Exam.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-2.5 md:mt-5 max-w-xl text-xs sm:text-sm leading-relaxed text-neutral-300 md:text-lg md:leading-7"
            >
              Practise realistic IOE and CEE mock tests, improve your speed and
              understand your performance before the real exam.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-5 md:mt-8 flex flex-row flex-wrap items-center gap-2.5 md:gap-3 justify-start"
            >
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-blue-500 to-blue-600 px-4 py-2.5 md:px-6 md:py-3.5 text-xs md:text-base font-semibold text-white transition-all hover:scale-[1.02] hover:from-blue-400 hover:to-blue-500 whitespace-nowrap text-center shadow-lg shadow-blue-600/25"
              >
                Start Practicing
                <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <Link
                href="/mock-tests"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 md:px-6 md:py-3.5 text-xs md:text-base font-medium text-white/90 transition-all hover:scale-[1.02] hover:bg-white/10 whitespace-nowrap text-center"
              >
                Explore Mock Tests
              </Link>
            </motion.div>

            {trustItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-4 md:mt-8 flex flex-wrap justify-start items-center gap-2 md:gap-5 text-[11px] md:text-xs text-neutral-400"
              >
                {trustItems.map((item, i) => (
                  <div key={item} className="flex items-center gap-2 md:gap-5">
                    {i > 0 && <div className="hidden sm:block h-3 md:h-4 w-px bg-white/10" />}
                    <span className="font-semibold text-neutral-100">{item}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Right: Spline 3D scene + floating UI cards — hidden entirely on mobile, no fallback graphic */}
          <div className="hidden md:flex md:h-auto md:min-h-[560px] relative items-center justify-center pointer-events-auto" style={{ touchAction: 'pan-y' }}>
            {isDesktop && (
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="absolute inset-0 w-full h-full"
              />
            )}

            {questionCount && (
              <FloatingStatCard
                icon={<ListChecks className="h-4 w-4" />}
                label="Practice Questions"
                value={`${questionCount.toLocaleString()}+`}
                mouseX={mouseX}
                mouseY={mouseY}
                floatClassName="animate-float-slow"
                delay={0.4}
                className="left-2 top-10 lg:left-6"
              />
            )}
            {mockTestCount && (
              <FloatingStatCard
                icon={<FileText className="h-4 w-4" />}
                label="Full Mock Tests"
                value={String(mockTestCount)}
                mouseX={mouseX}
                mouseY={mouseY}
                floatClassName="animate-float-slower"
                delay={0.55}
                className="bottom-14 left-0 lg:left-2"
              />
            )}
            <FloatingStatCard
              icon={<Sparkles className="h-4 w-4" />}
              label="Detailed Explanations"
              value="Instant Scoring"
              mouseX={mouseX}
              mouseY={mouseY}
              floatClassName="animate-float"
              delay={0.7}
              className="right-4 top-16 lg:right-8"
            />
          </div>
        </div>
      </div>

      <ExamSelectionModal open={open} onOpenChange={setOpen} defaultExam={exam} />
    </section>
  );
}
