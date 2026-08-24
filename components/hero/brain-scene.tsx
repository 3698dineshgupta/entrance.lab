"use client";
import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";

// The heavy part (three.js) stays dynamically imported so it's code-split
// into its own chunk, fetched only once this component actually mounts —
// never bundled into the main JS payload mobile users download, even
// though mobile never renders this at all (see the isDesktop gate in
// components/hero.tsx).
const BrainCanvas = dynamic(() => import("./brain-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="loader" />
    </div>
  ),
});

// Decorative CSS rings layered behind the real WebGL brain — pure visual
// framing (tilted + spun via CSS 3D transforms), independent of the actual
// 3D rotation happening inside the canvas.
const RINGS = [
  { size: 260, tilt: 74, offset: 0, duration: 16, dir: 1 },
  { size: 340, tilt: 70, offset: 40, duration: 22, dir: -1 },
  { size: 430, tilt: 76, offset: -25, duration: 28, dir: 1 },
];

export function BrainScene({ className = "", scale = 1 }: { className?: string; scale?: number }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={`${className} flex items-center justify-center`}>
      {/* Ambient glow behind the whole assembly */}
      <div
        className="pointer-events-none absolute h-80 w-80 rounded-full bg-gradient-to-br from-[#4F6BFF]/25 to-[#8B5CF6]/25 blur-3xl"
        aria-hidden="true"
      />

      {/* Scale lives on its own wrapper, separate from the float-bob
          animation below — a CSS @keyframes animation targeting `transform`
          overrides a static inline transform on the *same* element each
          frame, so a scale set here would get silently discarded if it sat
          on the animated div instead. */}
      <div style={scale !== 1 ? { transform: `scale(${scale})` } : undefined}>
      <div
        className={`relative flex items-center justify-center ${prefersReducedMotion ? "" : "animate-float"}`}
        style={{ perspective: 1200 }}
      >
        {/* Orbit rings */}
        <div className="absolute" style={{ transformStyle: "preserve-3d" }}>
          {RINGS.map((ring) => (
            <div
              key={ring.size}
              className="absolute"
              style={{
                top: -ring.size / 2,
                left: -ring.size / 2,
                transformStyle: "preserve-3d",
                transform: `rotateX(${ring.tilt}deg) rotateZ(${ring.offset}deg)`,
              }}
            >
              <div
                className={`rounded-full border border-[#4F6BFF]/25 ${prefersReducedMotion ? "" : "[animation:var(--ring-anim)]"}`}
                style={
                  {
                    width: ring.size,
                    height: ring.size,
                    "--ring-anim": `${ring.dir > 0 ? "ring-spin-cw" : "ring-spin-ccw"} ${ring.duration}s linear infinite`,
                  } as React.CSSProperties
                }
              >
                <span
                  className="absolute -top-[3px] left-1/2 h-[6px] w-[6px] -translate-x-1/2 rounded-full bg-[#3DD9FF] shadow-[0_0_8px_2px_rgba(61,217,255,0.7)]"
                  aria-hidden="true"
                />
              </div>
            </div>
          ))}
        </div>

        {/* The real, WebGL-rendered, continuously-rotating 3D brain. */}
        <div className="relative h-[380px] w-[380px]">
          <BrainCanvas />
        </div>
      </div>
      </div>
    </div>
  );
}
