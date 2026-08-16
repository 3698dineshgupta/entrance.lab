"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useSpring } from "framer-motion";
import { DataCollectionAnimation } from "./data-collection-animation";
import { SpiderWebStrand } from "./spider-web-strand";
import { useSpiderAuth } from "./spider-scene-context";
import { useTheme } from "@/components/theme-provider";

type Pose = "idle" | "cursor" | "approach" | "collecting" | "password-shield" | "password-peek" | "submitting" | "success" | "error";

// Legs are hand-authored paths; each pivot matches the leg's own start point
// so the CSS wiggle keyframe (which just rotates) reads as a natural joint.
const LEGS = [
  { d: "M24 26 Q10 22 2 14", pivot: "24px 26px", side: -1 },
  { d: "M24 30 Q8 30 -2 28", pivot: "24px 30px", side: -1 },
  { d: "M25 35 Q10 40 0 46", pivot: "25px 35px", side: -1 },
  { d: "M27 39 Q16 48 8 58", pivot: "27px 39px", side: -1 },
  { d: "M40 26 Q54 22 62 14", pivot: "40px 26px", side: 1 },
  { d: "M40 30 Q56 30 66 28", pivot: "40px 30px", side: 1 },
  { d: "M39 35 Q54 40 64 46", pivot: "39px 35px", side: 1 },
  { d: "M37 39 Q48 48 56 58", pivot: "37px 39px", side: 1 },
];

const TICK_MS = 45;
const IDLE_ADVANCE_MS = 4200;
const CARD_MARGIN = 28;

function computeWaypoints(scene: DOMRect, card: DOMRect, hasSideRoom: boolean) {
  const cardRight = card.right - scene.left;
  const cardLeft = card.left - scene.left;
  const cardTop = card.top - scene.top;
  const cardBottom = card.bottom - scene.top;
  const perch = { x: cardLeft + card.width / 2, y: Math.max(30, cardTop - 46) };
  return hasSideRoom
    ? [
        { x: cardRight + 46, y: cardTop + 30, rotation: -30 },
        { x: cardRight + 30, y: cardBottom - 20, rotation: 40 },
        { x: cardLeft - 46, y: cardBottom - 30, rotation: -140 },
        { x: cardLeft - 30, y: cardTop + 24, rotation: 160 },
      ]
    : [
        { x: perch.x - 42, y: perch.y, rotation: -15 },
        { x: perch.x + 42, y: perch.y, rotation: 15 },
      ];
}

// Pushes a point outside the card's bounding box (plus a margin) so the
// spider never sits on top of the form, whether it's chasing the cursor or
// just idling nearby. Projects radially from the box's center rather than
// snapping to the single nearest edge — a rectilinear snap freezes one axis
// completely while the cursor is anywhere near/behind the card (which, given
// how much of the panel the card occupies, is most of the time), which reads
// as the spider "getting stuck" instead of tracking. The radial projection
// keeps both axes moving together, so it smoothly orbits the card's
// perimeter in the cursor's actual direction instead.
function clampOutsideCard(x: number, y: number, card: { left: number; right: number; top: number; bottom: number }, margin: number) {
  const left = card.left - margin, right = card.right + margin, top = card.top - margin, bottom = card.bottom + margin;
  if (x <= left || x >= right || y <= top || y >= bottom) return { x, y };

  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  const hw = (right - left) / 2;
  const hh = (bottom - top) / 2;
  let dx = x - cx;
  let dy = y - cy;
  if (dx === 0 && dy === 0) dy = -1;

  const scaleX = dx !== 0 ? hw / Math.abs(dx) : Infinity;
  const scaleY = dy !== 0 ? hh / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY);

  return { x: cx + dx * scale, y: cy + dy * scale };
}

export function SpiderMascot() {
  const {
    sceneRef, cardRef, focusedField, getFieldRect, getFieldValue, lastCompletion,
    collectedFields, passwordRevealed, submitStage, errorNonce, spiderX, spiderY,
    spiderSpringX: springX, spiderSpringY: springY,
  } = useSpiderAuth();
  const reducedMotion = useReducedMotion();
  const { theme } = useTheme();
  // Legs are the one part tuned specifically for contrast against the card
  // behind them — a mid-teal reads clearly on the light card, but wants to
  // brighten back up to pop against the dark card in night mode.
  const legStroke = theme === "dark" ? "#67e8f9" : "#0891b2";

  const [pose, setPose] = useState<Pose>("idle");
  const [burst, setBurst] = useState<{ from: { x: number; y: number }; nonce: number } | null>(null);
  const [webThrow, setWebThrow] = useState<{ from: { x: number; y: number }; toRect: { left: number; top: number; width: number; height: number }; nonce: number } | null>(null);
  const [errorActive, setErrorActive] = useState(false);

  const wanderIdxRef = useRef(0);
  const idleSinceRef = useRef(0);
  const cursorRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const collectingTimeout = useRef<ReturnType<typeof setTimeout>>();
  const errorTimeout = useRef<ReturnType<typeof setTimeout>>();

  const rotate = useSpring(0, { stiffness: 80, damping: 16 });

  // Track the cursor, scoped to the scene, desktop-only (pointer: fine).
  useEffect(() => {
    if (reducedMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const onMove = (e: MouseEvent) => {
      const scene = sceneRef.current?.getBoundingClientRect();
      if (!scene) return;
      cursorRef.current = { x: e.clientX - scene.left, y: e.clientY - scene.top, active: true };
    };
    const onLeave = () => { cursorRef.current.active = false; };
    const el = sceneRef.current;
    el?.addEventListener("mousemove", onMove);
    el?.addEventListener("mouseleave", onLeave);
    return () => {
      el?.removeEventListener("mousemove", onMove);
      el?.removeEventListener("mouseleave", onLeave);
    };
  }, [reducedMotion, sceneRef]);

  // Error reaction — a temporary "collapse" that overrides the normal target
  // for a couple of seconds, then lets the regular tick resume (the spring
  // bouncing back up as it resumes is the "recovery").
  useEffect(() => {
    if (errorNonce === 0) return;
    setErrorActive(true);
    clearTimeout(errorTimeout.current);
    errorTimeout.current = setTimeout(() => setErrorActive(false), 1650);
    return () => clearTimeout(errorTimeout.current);
  }, [errorNonce]);

  // ── Single tick loop: recomputes pose + target from current auth-form
  // state, live cursor position, and idle-wander timing. ──
  useEffect(() => {
    // Writes straight to the motion values instead of going through React
    // state — a plain object literal (the old `setTarget({...})`) is a new
    // reference every tick, so React could never bail out of re-rendering,
    // meaning this whole SVG (8 animated legs, gradients, glow) re-rendered
    // on every tick. Motion values update the DOM via framer-motion's own
    // scheduler and never touch React's render cycle, so position no longer
    // costs a render at all — only an actual `pose` change does (and React
    // already bails out for repeated identical primitive state).
    const apply = (x: number, y: number, rotation: number) => {
      if (reducedMotion) {
        spiderX.jump(x);
        spiderY.jump(y);
        rotate.jump(rotation);
      } else {
        spiderX.set(x);
        spiderY.set(y);
        rotate.set(rotation);
      }
    };

    const tick = () => {
      const scene = sceneRef.current?.getBoundingClientRect();
      const card = cardRef.current?.getBoundingClientRect();
      if (!scene || !card) return;

      const cardBox = {
        left: card.left - scene.left, right: card.right - scene.left,
        top: card.top - scene.top, bottom: card.bottom - scene.top,
      };
      const cardCenterX = cardBox.left + card.width / 2;
      const hasSideRoom = card.right + 110 < scene.right;
      const perch = { x: cardCenterX, y: Math.max(30, cardBox.top - 46) };
      const shieldSpot = hasSideRoom
        ? { x: cardBox.left - 44, y: cardBox.top + 40 }
        : { x: Math.max(30, cardBox.left + 24), y: Math.max(28, cardBox.top - 46) };

      if (errorActive) {
        setPose("error");
        apply(springX.get(), springY.get() + 16, 18);
        return;
      }
      if (submitStage === "success") {
        setPose("success");
        apply(cardCenterX, cardBox.top - 8, 0);
        return;
      }
      if (submitStage === "working") {
        const btn = getFieldRect("submit");
        const bx = btn ? btn.left - scene.left + btn.width / 2 : cardCenterX;
        const by = btn ? btn.top - scene.top - 26 : cardBox.bottom + 30;
        setPose("submitting");
        apply(bx, by, 0);
        return;
      }
      if (focusedField === "password") {
        setPose(passwordRevealed ? "password-peek" : "password-shield");
        apply(shieldSpot.x, shieldSpot.y, passwordRevealed ? -10 : 200);
        return;
      }
      // Only "approach" a focused field once the user has actually typed
      // something into it — a bare focus (e.g. the page's initial autoFocus
      // on load, or tabbing through without typing) shouldn't permanently
      // pin the spider away from the cursor.
      if (focusedField && getFieldValue(focusedField).length > 0) {
        const rect = getFieldRect(focusedField);
        if (rect) {
          const fy = rect.top - scene.top + rect.height / 2;
          const fx = hasSideRoom ? cardBox.right + 40 : perch.x;
          setPose("approach");
          apply(fx, hasSideRoom ? fy : perch.y, hasSideRoom ? -20 : 0);
          return;
        }
      }

      // Cursor-following — the default "alive" behavior when nothing else
      // needs the spider's attention.
      if (cursorRef.current.active && !reducedMotion) {
        idleSinceRef.current = 0;
        const raw = clampOutsideCard(cursorRef.current.x - 20, cursorRef.current.y - 20, cardBox, CARD_MARGIN);
        const cx = Math.min(Math.max(raw.x, 24), scene.width - 24);
        const cy = Math.min(Math.max(raw.y, 24), scene.height - 24);
        const dx = cx - springX.get();
        const angle = (Math.atan2(cy - springY.get(), dx) * 180) / Math.PI;
        setPose("cursor");
        apply(cx, cy, angle);
        return;
      }

      // Idle wander — small orbit on desktop, gentle sway near the perch on mobile
      if (idleSinceRef.current === 0) idleSinceRef.current = Date.now();
      if (Date.now() - idleSinceRef.current > IDLE_ADVANCE_MS) {
        wanderIdxRef.current += 1;
        idleSinceRef.current = Date.now();
      }
      const waypoints = computeWaypoints(scene, card, hasSideRoom);
      setPose("idle");
      const wp = waypoints[wanderIdxRef.current % waypoints.length];
      apply(wp.x, wp.y, wp.rotation);
    };

    tick();
    const id = setInterval(tick, TICK_MS);
    window.addEventListener("resize", tick);
    return () => { clearInterval(id); window.removeEventListener("resize", tick); };
  }, [sceneRef, cardRef, focusedField, getFieldRect, getFieldValue, passwordRevealed, submitStage, errorActive, reducedMotion, springX, springY, spiderX, spiderY, rotate]);

  // React to a field being "completed" — spawn a data-collection burst
  // traveling from the field to wherever the spider currently is.
  useEffect(() => {
    if (!lastCompletion || reducedMotion) return;
    const scene = sceneRef.current?.getBoundingClientRect();
    if (!scene) return;
    const fieldRect = {
      left: lastCompletion.rect.left - scene.left,
      top: lastCompletion.rect.top - scene.top,
      width: lastCompletion.rect.width,
      height: lastCompletion.rect.height,
    };
    const fieldCenter = { x: fieldRect.left + fieldRect.width / 2, y: fieldRect.top + fieldRect.height / 2 };
    // Web is thrown spider -> field first, draping over the whole field
    // (not just landing on one point); once it lands, the particle burst
    // reels the "catch" back along the same line, field -> spider.
    setWebThrow({ from: { x: springX.get(), y: springY.get() }, toRect: fieldRect, nonce: lastCompletion.nonce });
    setBurst({ from: fieldCenter, nonce: lastCompletion.nonce });
    setPose("collecting");
    clearTimeout(collectingTimeout.current);
    collectingTimeout.current = setTimeout(() => setPose("idle"), 900);
    return () => clearTimeout(collectingTimeout.current);
  }, [lastCompletion, reducedMotion, sceneRef, springX, springY]);

  const glowing = pose === "collecting" || pose === "submitting" || pose === "success";
  const shielded = pose === "password-shield";
  const dying = pose === "error";
  const isMoving = pose !== "idle" && !dying;

  return (
    <>
      {webThrow && !reducedMotion && (
        <SpiderWebStrand
          key={`strand-${webThrow.nonce}`}
          from={webThrow.from}
          toRect={webThrow.toRect}
          color={legStroke}
          onDone={() => setWebThrow(null)}
        />
      )}

      {burst && !reducedMotion && (
        <DataCollectionAnimation
          key={burst.nonce}
          from={burst.from}
          to={{ x: springX.get(), y: springY.get() }}
          baseDelay={0.32}
          onDone={() => setBurst(null)}
        />
      )}

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-40"
        style={{ x: springX, y: springY, translateX: "-50%", translateY: "-50%" }}
        animate={dying ? { opacity: 0.55 } : { opacity: 1 }}
      >
        {/* Web nodes — one glowing marker per collected field, arranged in a small ring */}
        {collectedFields.map((f, i) => {
          const angle = (i / Math.max(collectedFields.length, 1)) * Math.PI * 2;
          const r = 26;
          return (
            <span
              key={f}
              className="absolute h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_2px_rgba(59,130,246,0.55)]"
              style={{
                left: 32 + Math.cos(angle) * r,
                top: 32 + Math.sin(angle) * r,
                animation: "spider-node-pulse 2.4s ease-in-out infinite",
                animationDelay: `${i * 0.3}s`,
              }}
            />
          );
        })}

        <motion.div
          animate={dying ? { rotate: [0, -8, 4, -3, 0], scale: 0.94 } : { rotate: [0, -3, 0, 3, 0], scale: 1 }}
          transition={{ duration: dying ? 0.6 : 2.6, repeat: reducedMotion || dying ? 0 : Infinity, ease: "easeInOut" }}
          style={{ rotate }}
        >
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ filter: dying ? "grayscale(0.55) brightness(0.85)" : "none" }}>
            <defs>
              <radialGradient id="spider-glow" cx="50%" cy="55%" r="55%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="spider-body" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>

            {/* Ambient glow */}
            {!dying && (
              <circle cx="32" cy="34" r={glowing ? 26 : 20} fill="url(#spider-glow)" opacity={glowing ? 0.9 : 0.45} />
            )}

            {/* Legs — droop downward and dim when the spider is "dying" */}
            {LEGS.map((leg, i) => (
              <path
                key={i}
                d={leg.d}
                stroke={legStroke}
                strokeOpacity={dying ? 0.35 : 0.85}
                strokeWidth="1.6"
                strokeLinecap="round"
                fill="none"
                style={{
                  transformOrigin: leg.pivot,
                  animation: dying ? "none" : `spider-leg-wiggle ${1.7 + (i % 3) * 0.25}s ease-in-out infinite`,
                  animationDelay: `${i * 0.09}s`,
                  transform: dying ? `rotate(${18 * leg.side}deg)` : undefined,
                  transition: "transform 0.5s ease-out",
                  ["--wiggle-a" as string]: isMoving ? `${-6 * leg.side}deg` : `${-2.5 * leg.side}deg`,
                  ["--wiggle-b" as string]: isMoving ? `${6 * leg.side}deg` : `${2.5 * leg.side}deg`,
                }}
              />
            ))}

            {/* Shield arc — only visible while guarding the password field */}
            {shielded && (
              <path
                d="M14 32 A18 18 0 0 1 50 32"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeOpacity="0.55"
                strokeDasharray="3 4"
                fill="none"
              />
            )}

            {/* Body */}
            <ellipse cx="32" cy="38" rx="11" ry="9.5" fill="url(#spider-body)" opacity={dying ? 0.75 : 1} />
            <ellipse cx="32" cy="25" rx="7.5" ry="6.5" fill="url(#spider-body)" opacity={dying ? 0.75 : 1} />

            {/* Eyes — close when dying instead of the normal idle blink */}
            <g style={{ animation: dying ? "none" : "spider-eye-blink 5s ease-in-out infinite", transform: dying ? "scaleY(0.15)" : undefined, transformOrigin: "32px 24px", transition: "transform 0.4s" }}>
              <circle cx="29" cy="24" r="1.6" fill="#f0fdff" />
              <circle cx="35" cy="24" r="1.6" fill="#f0fdff" />
            </g>
          </svg>
        </motion.div>
      </motion.div>
    </>
  );
}
