"use client";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface AuthSuccessAnimationProps {
  title: string;
  message: string;
}

// Renders in place of the form inside <AuthCard> once auth succeeds — the
// card itself "becomes" the success state rather than being covered by a
// separate overlay, so the whole thing reads as one continuous transition.
export function AuthSuccessAnimation({ title, message }: AuthSuccessAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center py-6 text-center"
    >
      <motion.span
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_30px_8px_rgba(34,211,238,0.35)]"
      >
        <Sparkles className="h-7 w-7 text-white" />
        <motion.span
          className="absolute inset-0 rounded-full border border-cyan-300/50"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
        />
      </motion.span>
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white"
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="mt-1.5 text-sm text-slate-500 dark:text-slate-400"
      >
        {message}
      </motion.p>
    </motion.div>
  );
}
