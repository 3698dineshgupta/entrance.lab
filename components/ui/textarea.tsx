import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex w-full rounded-lg border border-slate-200 bg-slate-900/[0.02] px-3.5 py-2.5 text-[16px] sm:text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-red-400/60 aria-[invalid=true]:focus-visible:ring-red-400/50 disabled:opacity-50 resize-none dark:border-white/10 dark:bg-white/[0.03]",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
