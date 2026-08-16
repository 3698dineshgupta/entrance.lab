"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ExamSelectionModal } from "@/components/exam-selection-modal";

export function CtaSection() {
  const [open, setOpen] = useState(false);

  return (
    <section className="container py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[24px] border border-white/10 bg-black px-6 py-14 text-center shadow-2xl md:px-12 md:py-20"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(600px 300px at 20% 0%, rgba(59,130,246,0.18), transparent 60%), radial-gradient(600px 300px at 80% 100%, rgba(167,139,250,0.16), transparent 60%)",
          }}
          aria-hidden="true"
        />
        {/* Hardcoded (not the theme-aware .grid-bg utility) — this card is
            intentionally always-black regardless of site theme. */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
          aria-hidden="true"
        />

        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Your rank starts with{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-violet-400">your next question.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-neutral-400 md:text-base">
            Free to start. No credit card, no catch — just a realistic mock test waiting for you.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group mx-auto mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-blue-500 to-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.03] hover:from-blue-400 hover:to-blue-500 md:text-base"
          >
            Start Practicing
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </motion.div>

      <ExamSelectionModal open={open} onOpenChange={setOpen} defaultExam="IOE" />
    </section>
  );
}
