"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ClipboardList, BookOpen, BarChart3, ShoppingBag, FileText, LucideIcon } from "lucide-react";

// Real EntranceLab destinations only — no invented "AI Mentor" / "Rank
// Predictor" style features. Position is percentage-based (0-100, matching
// the SVG viewBox below) so the connector lines line up with the cards
// without needing to measure anything at runtime.
interface Node {
  href: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  top: number;
  left: number;
  floatClassName: string;
  delay: number;
}

const NODES: Node[] = [
  { href: "/mock-tests", icon: ClipboardList, title: "Mock Tests", subtitle: "Full-length, timed", top: 6, left: 12, floatClassName: "animate-float-slow", delay: 0.3 },
  { href: "/practice", icon: BookOpen, title: "Practice", subtitle: "Subject-wise", top: 26, left: 60, floatClassName: "animate-float", delay: 0.45 },
  { href: "/analytics", icon: BarChart3, title: "Analytics", subtitle: "Track your rank", top: 54, left: 2, floatClassName: "animate-float-slower", delay: 0.6 },
  { href: "/merchandise", icon: ShoppingBag, title: "Merchandise", subtitle: "Buy & sell gear", top: 60, left: 58, floatClassName: "animate-float-slow", delay: 0.75 },
  { href: "/request-hub", icon: FileText, title: "Study Material", subtitle: "Request anything", top: 90, left: 32, floatClassName: "animate-float", delay: 0.9 },
];

const CENTER = { x: 50, y: 50 };

// Each badge emerges from roughly the brain's direction, holds, then
// fades back toward it — a continuous "the brain is surfacing an idea"
// loop rather than a one-shot entrance. Direction is just the sign of
// (center - node position), so the emerge motion always reads as coming
// from the middle of the box regardless of which side a badge sits on.
function emergeOffset(n: Node) {
  const dirX = Math.sign(CENTER.x - n.left) || 1;
  const dirY = Math.sign(CENTER.y - n.top) || 1;
  return { x: dirX * 30, y: dirY * 26 };
}

export function FeatureOrbit({ scale = 1 }: { scale?: number } = {}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={scale !== 1 ? { transform: `scale(${scale})` } : undefined}
    >
      {/* Connector lines — "light traveling into the brain" via an animated
          dash offset, drawn behind the node cards. */}
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="orbitLineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F6BFF" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#3DD9FF" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {NODES.map((n) => {
          const x1 = n.left;
          const y1 = n.top + 4;
          const cx = (x1 + CENTER.x) / 2;
          const cy = (y1 + CENTER.y) / 2 + (y1 < CENTER.y ? 6 : -6);
          return (
            <path
              key={n.href}
              d={`M ${x1} ${y1} Q ${cx} ${cy} ${CENTER.x} ${CENTER.y}`}
              fill="none"
              stroke="url(#orbitLineGradient)"
              strokeWidth="0.45"
              vectorEffect="non-scaling-stroke"
              className="[stroke-dasharray:3_5] animate-[orbit-line-flow_2.4s_linear_infinite]"
            />
          );
        })}
      </svg>

      {NODES.map((n, i) => {
        const offset = emergeOffset(n);
        return (
        <div
          key={n.href}
          className={`pointer-events-auto absolute will-change-transform ${n.floatClassName}`}
          style={{ top: `${n.top}%`, left: `${n.left}%` }}
        >
          <motion.div
            initial={{ opacity: 0, x: offset.x, y: offset.y, scale: 0.85 }}
            animate={
              prefersReducedMotion
                ? { opacity: 1, x: 0, y: 0, scale: 1 }
                : {
                    opacity: [0, 1, 1, 0],
                    x: [offset.x, 0, 0, offset.x],
                    y: [offset.y, 0, 0, offset.y],
                    scale: [0.85, 1, 1, 0.85],
                  }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0.6, delay: n.delay, ease: [0.16, 1, 0.3, 1] }
                : {
                    duration: 5.5 + i * 0.6,
                    times: [0, 0.16, 0.72, 1],
                    delay: n.delay,
                    repeat: Infinity,
                    repeatDelay: 0.4,
                    ease: "easeInOut",
                  }
            }
          >
            <Link
              href={n.href}
              className="group flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 shadow-xl shadow-black/40 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-[#4F6BFF]/50 hover:shadow-[#4F6BFF]/20"
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-[#4F6BFF]/25 to-[#8B5CF6]/25 text-[#8FB4FF] transition-transform duration-300 group-hover:scale-110">
                <n.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block whitespace-nowrap text-[13px] font-semibold leading-tight text-white">{n.title}</span>
                <span className="block whitespace-nowrap text-[10.5px] leading-tight text-[#B8C2E6]">{n.subtitle}</span>
              </span>
            </Link>
          </motion.div>
        </div>
        );
      })}
    </div>
  );
}
