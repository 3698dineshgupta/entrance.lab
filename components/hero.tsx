'use client'
import { useEffect, useState } from "react";
import Link from "next/link";
import { SplineScene } from "@/components/ui/spline-scene";
import { Spotlight } from "@/components/ui/spotlight";
import { ExamSelectionModal } from "@/components/exam-selection-modal";
import { ExamType } from "@/lib/types";

export function Hero() {
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

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-5 sm:py-6 md:px-6 md:py-8">
      <div className="grid-bg relative md:min-h-[560px] overflow-hidden rounded-[20px] border border-white/10 bg-black shadow-2xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black md:bg-gradient-to-r md:from-black/20 md:via-black/60 md:to-black" />
        <Spotlight
          className="-left-20 -top-40 md:left-20 md:-top-28"
          fill="white"
        />

        <div className="relative z-10 flex flex-col md:grid md:grid-cols-[48%_52%] md:min-h-[560px] items-center">
          {/* Left: content — full width on mobile since there's no 3D column there */}
          <div className="flex flex-col justify-center w-full px-5 sm:px-6 md:px-12 lg:px-16 py-6 sm:py-7 md:py-12 z-20 text-left">
            <p className="mb-2 md:mb-4 text-[11px] sm:text-xs md:text-sm font-medium uppercase tracking-[0.18em] text-blue-400">
              IOE &amp; CEE Mock Tests
            </p>
            <h1 className="max-w-xl text-2xl sm:text-3xl font-bold leading-tight text-white md:text-5xl lg:text-6xl not-italic">
              Master Your Entrance Exam
            </h1>
            <p className="mt-2.5 md:mt-5 max-w-xl text-xs sm:text-sm leading-relaxed text-neutral-300 md:text-lg md:leading-7">
              Practise realistic IOE and CEE mock tests, improve your speed and
              understand your performance before the real exam.
            </p>

            <div className="mt-5 md:mt-8 flex flex-row flex-wrap items-center gap-2.5 md:gap-3 justify-start">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="rounded-lg md:rounded-xl bg-blue-600 px-4 py-2.5 md:px-6 md:py-3.5 text-xs md:text-base font-semibold text-white transition hover:bg-blue-500 whitespace-nowrap text-center shadow-lg shadow-blue-600/20"
              >
                Select Exam
              </button>
              <Link
                href="/mock-tests"
                className="inline-flex items-center justify-center rounded-lg md:rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 md:px-6 md:py-3.5 text-xs md:text-base font-medium text-white/90 transition hover:bg-white/10 whitespace-nowrap text-center"
              >
                Mock Test
              </Link>
            </div>

            <div className="mt-4 md:mt-8 flex flex-wrap justify-start items-center gap-2 md:gap-5 text-[11px] md:text-xs text-neutral-400">
              <div><span className="font-semibold text-neutral-100">10,000+</span> questions</div>
              <div className="hidden sm:block h-3 md:h-4 w-px bg-white/10" />
              <div><span className="font-semibold text-neutral-100">Real</span> exam pattern</div>
            </div>
          </div>

          {/* Right: Spline 3D scene — hidden entirely on mobile, no fallback graphic */}
          <div className="hidden md:flex md:h-auto md:min-h-[560px] relative items-center justify-center pointer-events-auto" style={{ touchAction: 'pan-y' }}>
            {isDesktop && (
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="absolute inset-0 w-full h-full"
              />
            )}
          </div>
        </div>
      </div>

      <ExamSelectionModal open={open} onOpenChange={setOpen} defaultExam={exam} />
    </section>
  );
}
