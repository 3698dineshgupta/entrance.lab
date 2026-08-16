"use client";
import { useEffect, useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useSpiderAuth } from "./spider-scene-context";

const RINGS = [90, 150, 220, 300];
const SPOKES = 8;

// A very faint web etched into the white auth panel — desktop cursor gives
// it a light parallax. Kept subtle on purpose: the form is the priority,
// this is just texture that the spider's movement feels connected to.
export function SpiderWeb() {
  const { submitStage } = useSpiderAuth();
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const springX = useSpring(px, { stiffness: 40, damping: 20 });
  const springY = useSpring(py, { stiffness: 40, damping: 20 });

  useEffect(() => {
    if (reducedMotion) return;
    const onMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      px.set(nx * 10);
      py.set(ny * 10);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [reducedMotion, px, py]);

  const celebrating = submitStage === "success";

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <motion.svg
        className="absolute left-1/2 top-1/2"
        style={{ x: springX, y: springY, translateX: "-50%", translateY: "-50%" }}
        width="820"
        height="820"
        viewBox="0 0 820 820"
      >
        {/* Slightly brighter + stronger glow at night — a plain hex stroke
            attribute can't respond to the .dark class, so this uses Tailwind's
            stroke-color/opacity utilities instead. */}
        <g className="stroke-blue-400 stroke-opacity-10 dark:stroke-cyan-300 dark:stroke-opacity-[0.16]" fill="none">
          {RINGS.map((r) => (
            <circle
              key={r}
              cx="410"
              cy="410"
              r={celebrating ? r * 1.05 : r}
              style={{
                animation: `spider-web-pulse ${4 + r / 80}s ease-in-out infinite`,
                transition: "r 1.2s cubic-bezier(0.16,1,0.3,1)",
              }}
            />
          ))}
          {Array.from({ length: SPOKES }).map((_, i) => {
            const angle = (i / SPOKES) * Math.PI * 2;
            const x2 = 410 + Math.cos(angle) * 360;
            const y2 = 410 + Math.sin(angle) * 360;
            return <line key={i} x1="410" y1="410" x2={x2} y2={y2} />;
          })}
        </g>
      </motion.svg>

      {/* A couple of very faint ambient motes — cheap, CSS-only */}
      {!reducedMotion && (
        <div className="absolute inset-0">
          {[
            { l: "16%", t: "22%", d: "9s", s: "0s" },
            { l: "80%", t: "18%", d: "11s", s: "1.4s" },
            { l: "24%", t: "74%", d: "8s", s: "2.1s" },
            { l: "72%", t: "76%", d: "10.5s", s: "0.7s" },
          ].map((p, i) => (
            <span
              key={i}
              className="absolute h-1 w-1 rounded-full bg-blue-400/40 dark:bg-cyan-300/50"
              style={{ left: p.l, top: p.t, animation: `spider-web-pulse ${p.d} ease-in-out infinite`, animationDelay: p.s }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
