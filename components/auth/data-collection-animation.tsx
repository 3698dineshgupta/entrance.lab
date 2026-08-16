"use client";
import { useRef } from "react";
import { DataParticle } from "./data-particle";

interface DataCollectionAnimationProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  baseDelay?: number;
  onDone: () => void;
}

const PARTICLE_COUNT = 5;

// Fires once per completed field: a small burst of particles traveling from
// the field toward the spider's current position. Purely decorative — the
// actual form value is untouched, this just visualizes "the data was seen."
// `baseDelay` lets the caller hold these back until the web strand (thrown
// first, in the opposite direction) has actually landed on the field.
export function DataCollectionAnimation({ from, to, baseDelay = 0, onDone }: DataCollectionAnimationProps) {
  const remaining = useRef(PARTICLE_COUNT);

  const handleOne = () => {
    remaining.current -= 1;
    if (remaining.current <= 0) onDone();
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-30" aria-hidden="true">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <DataParticle key={i} from={from} to={to} delay={baseDelay + i * 0.06} onComplete={handleOne} />
      ))}
    </div>
  );
}
