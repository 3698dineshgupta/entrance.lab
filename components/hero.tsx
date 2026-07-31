'use client'
import { useState } from "react";
import Link from "next/link";
import { SplineScene } from "@/components/ui/spline-scene";
import { Spotlight } from "@/components/ui/spotlight";
import { ExamSelectionModal } from "@/components/exam-selection-modal";
import { ExamType } from "@/lib/types";

export function Hero() {
  const [open, setOpen] = useState(false);
  const [exam, setExam] = useState<ExamType>("IOE");

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <div className="relative min-h-[380px] md:min-h-[560px] overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
        <Spotlight className="-left-20 -top-40 md:left-20 md:-top-28" fill="white" />

        <div className="relative z-10 flex h-full min-h-[380px] md:min-h-[560px] flex-col md:flex-row md:items-center">
          {/* Left: content — full width on mobile, 48% on desktop */}
          <div className="flex flex-col justify-center flex-1 px-6 sm:px-8 md:px-12 lg:px-16 py-10 md:py-12 z-20">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
              IOE &amp; CEE Mock Tests
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white max-w-lg">
              Master Your<br />Entrance Exam
            </h1>
            <p className="mt-4 max-w-md text-sm sm:text-base leading-relaxed text-neutral-300 md:text-lg md:leading-7">
              Practise realistic IOE and CEE mock tests, improve your speed and
              understand your performance before the real exam.
            </p>

            <div className="mt-7 flex flex-row flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-95"
              >
                Select Exam
              </button>
              <Link
                href="/mock-tests"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-95"
              >
                Mock Tests
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-neutral-400">
              <div><span className="font-semibold text-neutral-100">10,000+</span> questions</div>
              <div className="h-3 w-px bg-white/20" />
              <div><span className="font-semibold text-neutral-100">Real</span> exam pattern</div>
              <div className="h-3 w-px bg-white/20" />
              <div><span className="font-semibold text-neutral-100">Free</span> to use</div>
            </div>
          </div>

          {/* Right: Spline 3D scene — hidden on mobile to avoid cramping */}
          <div className="hidden md:flex w-[48%] min-h-[560px] relative items-center justify-center pointer-events-auto shrink-0" style={{ touchAction: 'none' }}>
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>
      </div>

      <ExamSelectionModal open={open} onOpenChange={setOpen} defaultExam={exam} />
    </section>
  );
}
