"use client";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useSpiderAuth } from "./spider-scene-context";

const MAX_POINTS = 10;
const SAMPLE_MS = 70;
const MIN_STEP = 3; // px — skip samples while the spider is essentially still

// A short, fading glow-thread behind the spider's actual rendered position
// (the same spring the mascot renders from, so it can never drift out of
// sync). Samples on an interval rather than every animation frame — a
// lagging/fading trail doesn't need 60fps of its own churn.
export function SpiderWebTrail() {
  const { spiderSpringX, spiderSpringY } = useSpiderAuth();
  const reducedMotion = useReducedMotion();
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const lastRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => {
      const x = spiderSpringX.get();
      const y = spiderSpringY.get();
      const last = lastRef.current;
      if (last && Math.hypot(x - last.x, y - last.y) < MIN_STEP) return;
      lastRef.current = { x, y };
      setPoints((prev) => [...prev, { x, y }].slice(-MAX_POINTS));
    }, SAMPLE_MS);
    return () => clearInterval(id);
  }, [reducedMotion, spiderSpringX, spiderSpringY]);

  if (reducedMotion || points.length < 2) return null;

  return (
    <svg className="pointer-events-none absolute inset-0 z-30 h-full w-full overflow-visible" aria-hidden="true">
      <defs>
        <filter id="trail-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.1" />
        </filter>
      </defs>
      {/* One shared blur filter for the whole trail instead of one per
          segment — SVG filters are expensive to composite, and re-applying
          one to up to a dozen separate elements every sample was a real
          cost at this update rate. */}
      <g filter="url(#trail-glow)">
        {points.slice(1).map((p, i) => {
          const prev = points[i];
          const age = (i + 1) / points.length; // 0 = oldest, 1 = newest
          return (
            <line
              key={i}
              x1={prev.x}
              y1={prev.y}
              x2={p.x}
              y2={p.y}
              stroke="#3b82f6"
              strokeWidth={1 + age}
              strokeLinecap="round"
              opacity={age * 0.4}
            />
          );
        })}
      </g>
    </svg>
  );
}
