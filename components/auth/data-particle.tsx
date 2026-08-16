"use client";
import { motion } from "framer-motion";

interface DataParticleProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  delay: number;
  onComplete?: () => void;
}

// A single glowing mote that travels from a completed field toward the
// spider along a gently curved path (a gathered mid-point, not a straight
// line, so a burst of these reads as organic rather than mechanical).
export function DataParticle({ from, to, delay, onComplete }: DataParticleProps) {
  const midX = (from.x + to.x) / 2 + (Math.random() - 0.5) * 24;
  const midY = (from.y + to.y) / 2 + (Math.random() - 0.5) * 24;

  return (
    <motion.span
      aria-hidden="true"
      className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_3px_rgba(59,130,246,0.55)]"
      style={{ left: from.x, top: from.y }}
      initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
      animate={{
        x: [0, midX - from.x, to.x - from.x],
        y: [0, midY - from.y, to.y - from.y],
        opacity: [0, 1, 1, 0],
        scale: [0.4, 1, 0.8, 0.3],
      }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      onAnimationComplete={onComplete}
    />
  );
}
