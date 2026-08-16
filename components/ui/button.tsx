import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20 hover:from-blue-400 hover:to-blue-500",
        secondary:
          "bg-slate-900/[0.04] text-foreground border border-slate-200 hover:bg-slate-900/[0.07] hover:border-slate-300 dark:bg-white/[0.06] dark:border-white/10 dark:hover:bg-white/[0.09] dark:hover:border-white/20",
        outline:
          "border border-slate-200 bg-transparent hover:bg-slate-900/[0.04] dark:border-white/15 dark:hover:bg-white/[0.04]",
        ghost: "hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.06]",
        destructive:
          "bg-red-500/90 text-white hover:bg-red-500",
        accent:
          "bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20 hover:from-orange-400 hover:to-orange-500",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
