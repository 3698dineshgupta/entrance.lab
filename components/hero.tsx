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
    <section className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
      <div className="relative md:min-h-[560px] overflow-hidden rounded-[20px] border border-white/10 bg-black shadow-2xl">
        <Spotlight
          className="-left-20 -top-40 md:left-20 md:-top-28"
          fill="white"
        />

        <div className="relative z-10 flex flex-row md:grid md:grid-cols-[48%_52%] md:min-h-[560px] items-center">
          {/* Left: content */}
          <div className="flex flex-col justify-center w-[55%] md:w-full px-4 sm:px-6 md:px-12 lg:px-16 py-6 md:py-12 z-20 text-left">
            <p className="mb-2 md:mb-4 text-[9px] sm:text-xs md:text-sm font-medium uppercase tracking-[0.18em] text-blue-400">
              IOE &amp; CEE Mock Tests
            </p>
            <h1 className="max-w-xl text-xl sm:text-3xl font-bold leading-tight text-white md:text-5xl lg:text-6xl not-italic">
              Master Your Entrance Exam
            </h1>
            <p className="mt-2 md:mt-5 max-w-xl text-[10px] sm:text-sm leading-relaxed text-neutral-300 md:text-lg md:leading-7">
              Practise realistic IOE and CEE mock tests, improve your speed and
              understand your performance before the real exam.
            </p>

            <div className="mt-5 md:mt-8 flex flex-col sm:flex-row gap-2 md:gap-3 justify-start">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="rounded-lg md:rounded-xl bg-blue-600 px-3 py-2 md:px-6 md:py-3.5 text-[10px] md:text-base font-semibold text-white transition hover:bg-blue-500 whitespace-nowrap text-center"
              >
                Select Exam
              </button>
              <Link
                href="/mock-tests"
                className="inline-flex items-center justify-center rounded-lg md:rounded-xl border border-white/20 bg-white/5 px-3 py-2 md:px-6 md:py-3.5 text-[10px] md:text-base font-semibold text-white transition hover:bg-white/10 whitespace-nowrap text-center"
              >
                Mock Test
              </Link>
            </div>

            <div className="mt-4 md:mt-8 flex flex-wrap justify-start items-center gap-2 md:gap-5 text-[9px] md:text-xs text-neutral-400">
              <div><span className="font-semibold text-neutral-100">10,000+</span> questions</div>
              <div className="hidden sm:block h-3 md:h-4 w-px bg-white/10" />
              <div><span className="font-semibold text-neutral-100">Real</span> exam pattern</div>
            </div>
          </div>

          {/* Right: Spline 3D scene */}
          <div className="w-[45%] md:w-auto h-[260px] sm:h-[300px] md:h-auto md:min-h-[560px] relative flex items-center justify-center pointer-events-auto" style={{ touchAction: 'none' }}>
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
