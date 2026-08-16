"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useSpiderAuth } from "./spider-scene-context";
import { AuthSuccessAnimation } from "./auth-success-animation";

interface AuthCardProps {
  title: string;
  subtitle: string;
  successTitle: string;
  successMessage: string;
  children: React.ReactNode;
}

export function AuthCard({ title, subtitle, successTitle, successMessage, children }: AuthCardProps) {
  const { cardRef, submitStage } = useSpiderAuth();

  return (
    <div ref={cardRef} className="relative z-10 w-full max-w-sm">
      <AnimatePresence mode="wait" initial={false}>
        {submitStage === "success" ? (
          <AuthSuccessAnimation key="success" title={successTitle} message={successMessage} />
        ) : (
          <motion.div
            key="form"
            initial={false}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
          >
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">{subtitle}</p>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
