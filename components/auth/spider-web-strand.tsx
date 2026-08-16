"use client";
import { motion } from "framer-motion";

interface FieldRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface SpiderWebStrandProps {
  from: { x: number; y: number };
  toRect: FieldRect;
  color: string;
  onDone?: () => void;
}

// Fires once per completed field: a silk strand shoots from the spider's
// current position to the field (the "throw"), then a small web net drapes
// over the whole field — not just a point — briefly covering what was typed,
// right as DataParticle's dots start reeling the catch back along the same
// line. Purely decorative, like the rest of this layer.
export function SpiderWebStrand({ from, toRect, color, onDone }: SpiderWebStrandProps) {
  const to = { x: toRect.left + toRect.width / 2, y: toRect.top + toRect.height / 2 };
  const midX = (from.x + to.x) / 2 + (to.y - from.y) * 0.1;
  const midY = (from.y + to.y) / 2 - (to.x - from.x) * 0.1;
  const d = `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;

  const inset = 3;
  const left = toRect.left + inset;
  const top = toRect.top + inset;
  const right = toRect.left + toRect.width - inset;
  const bottom = toRect.top + toRect.height - inset;
  const midXField = (left + right) / 2;
  const midYField = (top + bottom) / 2;

  return (
    <svg className="pointer-events-none absolute inset-0 z-30 overflow-visible" aria-hidden="true">
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0.85 }}
        animate={{ pathLength: [0, 1, 1], opacity: [0.85, 0.85, 0] }}
        transition={{ duration: 0.6, times: [0, 0.4, 1], ease: "easeOut" }}
        onAnimationComplete={onDone}
      />

      {/* Net that drapes over the whole field once the strand lands */}
      <motion.g
        stroke={color}
        strokeWidth={1}
        strokeLinecap="round"
        fill="none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.75, 0.75, 0] }}
        transition={{ duration: 0.5, delay: 0.24, times: [0, 0.3, 0.75, 1], ease: "easeOut" }}
      >
        <rect x={left} y={top} width={right - left} height={bottom - top} rx={6} strokeOpacity={0.55} />
        <line x1={left} y1={top} x2={right} y2={bottom} strokeOpacity={0.4} />
        <line x1={right} y1={top} x2={left} y2={bottom} strokeOpacity={0.4} />
        <line x1={left} y1={midYField} x2={right} y2={midYField} strokeOpacity={0.4} />
        <line x1={midXField} y1={top} x2={midXField} y2={bottom} strokeOpacity={0.4} />
      </motion.g>
    </svg>
  );
}
