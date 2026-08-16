"use client";
import { ReactNode } from "react";
import { motion, useSpring, useTransform, MotionValue } from "framer-motion";

export function FloatingStatCard({
  icon,
  label,
  value,
  className,
  mouseX,
  mouseY,
  tiltStrength = 8,
  floatClassName = "animate-float",
  delay = 0,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  className?: string;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  tiltStrength?: number;
  floatClassName?: string;
  delay?: number;
}) {
  // Three-point mapping keeps the resting state (no pointer movement yet,
  // e.g. touch devices) at exactly 0deg instead of a skewed default.
  const rotateX = useSpring(
    useTransform(mouseY, [-1, 0, 1], [tiltStrength, 0, -tiltStrength]),
    { stiffness: 150, damping: 20, mass: 0.5 }
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-1, 0, 1], [-tiltStrength, 0, tiltStrength]),
    { stiffness: 150, damping: 20, mass: 0.5 }
  );

  return (
    // Outer node owns the CSS keyframe bob so it never competes with the
    // inner motion.div's own transform (entrance animation + pointer tilt).
    <div className={`pointer-events-none absolute will-change-transform ${floatClassName} ${className ?? ""}`}>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.94 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
        style={{ rotateX, rotateY, transformPerspective: 800 }}
      >
        {/* Hardcoded dark glass, not the theme-aware .glass utility — this card
            always sits on Hero's intentionally-always-black showcase panel,
            regardless of the site-wide day/night theme. */}
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 shadow-xl shadow-black/40 backdrop-blur-xl">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-cyan-300">
            {icon}
          </span>
          <div className="min-w-0">
            <p className="whitespace-nowrap text-sm font-semibold leading-none text-white">{value}</p>
            <p className="mt-1 whitespace-nowrap text-[11px] leading-none text-neutral-400">{label}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
