import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-lg border border-slate-200 bg-slate-900/[0.02] px-3.5 py-2 text-[16px] sm:text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent aria-[invalid=true]:border-red-400/60 aria-[invalid=true]:focus-visible:ring-red-400/50 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.03]",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
