"use client";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useMotionValue, useSpring, type MotionValue } from "framer-motion";

export type SubmitStage = "idle" | "working" | "success";

export interface FieldCompletion {
  field: string;
  rect: DOMRect;
  nonce: number;
}

interface SpiderAuthContextValue {
  sceneRef: React.RefObject<HTMLDivElement>;
  cardRef: React.RefObject<HTMLDivElement>;
  registerField: (name: string, el: HTMLElement | null) => void;
  getFieldRect: (name: string) => DOMRect | null;
  getFieldValue: (name: string) => string;
  focusedField: string | null;
  focusField: (name: string) => void;
  blurField: (name: string) => void;
  completeField: (name: string) => void;
  lastCompletion: FieldCompletion | null;
  collectedFields: string[];
  passwordRevealed: boolean;
  setPasswordRevealed: (v: boolean) => void;
  submitStage: SubmitStage;
  setSubmitStage: (s: SubmitStage) => void;
  statusText: string | null;
  setStatusText: (s: string | null) => void;
  errorNonce: number;
  triggerError: () => void;
  // spiderX/Y are the raw movement target (set by SpiderMascot's tick loop);
  // spiderSpringX/Y are the single shared spring following them — both
  // SpiderMascot (rendering) and SpiderWebTrail (sampling) read the *same*
  // spring instance so the trail can never visually diverge from the spider.
  spiderX: MotionValue<number>;
  spiderY: MotionValue<number>;
  spiderSpringX: MotionValue<number>;
  spiderSpringY: MotionValue<number>;
}

const SpiderAuthContext = createContext<SpiderAuthContextValue | null>(null);

export function SpiderAuthProvider({ children }: { children: React.ReactNode }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const fieldsRef = useRef<Map<string, HTMLElement>>(new Map());
  // Tracks the value last "collected" per field so re-focusing an already
  // -completed field without changing it doesn't replay the eating effect.
  const lastCollectedRef = useRef<Map<string, string>>(new Map());
  const nonceRef = useRef(0);
  const errorNonceRef = useRef(0);

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [lastCompletion, setLastCompletion] = useState<FieldCompletion | null>(null);
  const [collectedFields, setCollectedFields] = useState<string[]>([]);
  const [passwordRevealed, setPasswordRevealed] = useState(false);
  const [submitStage, setSubmitStage] = useState<SubmitStage>("idle");
  const [statusText, setStatusText] = useState<string | null>(null);
  const [errorNonce, setErrorNonce] = useState(0);

  const spiderX = useMotionValue(40);
  const spiderY = useMotionValue(40);
  const spiderSpringX = useSpring(spiderX, { stiffness: 170, damping: 22, mass: 0.7 });
  const spiderSpringY = useSpring(spiderY, { stiffness: 170, damping: 22, mass: 0.7 });

  const registerField = useCallback((name: string, el: HTMLElement | null) => {
    if (el) fieldsRef.current.set(name, el);
    else fieldsRef.current.delete(name);
  }, []);

  const getFieldRect = useCallback((name: string) => {
    return fieldsRef.current.get(name)?.getBoundingClientRect() ?? null;
  }, []);

  // The caller only ever checks .length on this — used to decide the
  // spider's "approach this field" reflex, never displayed, logged, or sent
  // anywhere.
  const getFieldValue = useCallback((name: string) => {
    const el = fieldsRef.current.get(name);
    return (el?.querySelector("input") as HTMLInputElement | null)?.value ?? "";
  }, []);

  const focusField = useCallback((name: string) => setFocusedField(name), []);
  const blurField = useCallback((name: string) => {
    setFocusedField((cur) => (cur === name ? null : cur));
  }, []);

  const completeField = useCallback((name: string) => {
    const el = fieldsRef.current.get(name);
    if (!el) return;
    const input = el.querySelector("input") as HTMLInputElement | null;
    const value = input?.value ?? "";
    if (!value) return;
    if (lastCollectedRef.current.get(name) === value) return; // unchanged since last collection
    lastCollectedRef.current.set(name, value);
    nonceRef.current += 1;
    setLastCompletion({ field: name, rect: el.getBoundingClientRect(), nonce: nonceRef.current });
    setCollectedFields((prev) => (prev.includes(name) ? prev : [...prev, name]));
  }, []);

  const triggerError = useCallback(() => {
    errorNonceRef.current += 1;
    setErrorNonce(errorNonceRef.current);
  }, []);

  const value = useMemo<SpiderAuthContextValue>(() => ({
    sceneRef,
    cardRef,
    registerField,
    getFieldRect,
    getFieldValue,
    focusedField,
    focusField,
    blurField,
    completeField,
    lastCompletion,
    collectedFields,
    passwordRevealed,
    setPasswordRevealed,
    submitStage,
    setSubmitStage,
    statusText,
    setStatusText,
    errorNonce,
    triggerError,
    spiderX,
    spiderY,
    spiderSpringX,
    spiderSpringY,
  }), [registerField, getFieldRect, getFieldValue, focusedField, focusField, blurField, completeField, lastCompletion, collectedFields, passwordRevealed, submitStage, statusText, errorNonce, triggerError, spiderX, spiderY, spiderSpringX, spiderSpringY]);

  return <SpiderAuthContext.Provider value={value}>{children}</SpiderAuthContext.Provider>;
}

export function useSpiderAuth() {
  const ctx = useContext(SpiderAuthContext);
  if (!ctx) throw new Error("useSpiderAuth must be used within a SpiderAuthProvider");
  return ctx;
}
