"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme, mounted } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to day mode" : "Switch to night mode"}
      aria-pressed={isDark}
      className={cn(
        "relative inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border transition-colors",
        "border-slate-200 bg-slate-100 hover:bg-slate-200 dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.1]",
        className
      )}
    >
      <span className="sr-only">Toggle day/night theme</span>
      {mounted && (
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isDark ? "moon" : "sun"}
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center"
          >
            {isDark ? (
              <Moon className="h-4 w-4 text-blue-300" />
            ) : (
              <Sun className="h-4 w-4 text-amber-500" />
            )}
          </motion.span>
        </AnimatePresence>
      )}
    </button>
  );
}
