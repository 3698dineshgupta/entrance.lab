"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, ButtonProps } from "@/components/ui/button";
import { useSpiderAuth } from "./spider-scene-context";

// Registers itself as the "submit" field so the mascot has somewhere to
// converge on while the form is submitting, and layers a decorative "energy
// absorbed" sweep on top while working. The real <button> is never removed
// or disabled beyond the caller's own `disabled` prop — this is purely a
// pointer-events-none overlay, so the actual submit click/keyboard activation
// is completely unaffected.
export function AuthSubmitButton(props: ButtonProps) {
  const { registerField, submitStage } = useSpiderAuth();
  const ref = useRef<HTMLButtonElement>(null);
  const working = submitStage === "working";

  useEffect(() => {
    registerField("submit", ref.current);
    return () => registerField("submit", null);
  }, [registerField]);

  return (
    <motion.div
      className="relative"
      animate={working ? { scale: [1, 0.97, 1] } : { scale: 1 }}
      transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <Button ref={ref} {...props} />
      <AnimatePresence>
        {working && (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              initial={{ x: "-120%" }}
              animate={{ x: "220%" }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
