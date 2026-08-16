"use client";
import { useEffect, useRef, useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpiderAuth } from "./spider-scene-context";

interface AuthFieldProps {
  name: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  autoFocus?: boolean;
  required?: boolean;
  minLength?: number;
  invalid?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  icon?: React.ReactNode;
  labelAside?: React.ReactNode;
}

// A real, fully-functional labeled input — the spider/particle layer only
// ever reads focus/blur events from this; nothing here depends on it, so
// typing, autofill, password managers, and screen readers all work exactly
// as if the decoration didn't exist.
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { name, label, type = "text", value, onChange, autoComplete, autoFocus, required, minLength, invalid, inputMode, icon, labelAside },
  ref
) {
  const { registerField, focusField, blurField, completeField, setPasswordRevealed, passwordRevealed } = useSpiderAuth();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const isPassword = type === "password";
  const revealed = isPassword && passwordRevealed;

  useEffect(() => {
    registerField(name, wrapperRef.current);
    return () => registerField(name, null);
  }, [name, registerField]);

  return (
    <div ref={wrapperRef} className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={name} className={cn("block text-sm font-medium transition-colors", focused ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300")}>
          {label}
        </label>
        {labelAside}
      </div>
      <div className="relative">
        {icon && (
          <span className={cn("pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors", focused ? "text-blue-500 dark:text-blue-400" : "text-slate-400 dark:text-slate-500")}>
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={name}
          name={name}
          type={isPassword ? (revealed ? "text" : "password") : type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          required={required}
          minLength={minLength}
          value={value}
          aria-invalid={invalid}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => { setFocused(true); focusField(name); }}
          onBlur={() => {
            setFocused(false);
            blurField(name);
            completeField(name);
          }}
          className={cn(
            "flex h-12 w-full rounded-xl border bg-slate-50 text-[16px] sm:text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus-visible:outline-none dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500",
            icon ? "pl-11 pr-3.5" : "px-3.5",
            isPassword && "pr-11",
            focused
              ? "border-blue-400 bg-white shadow-[0_0_0_3px_rgba(59,130,246,0.12)] dark:bg-white/[0.06] dark:shadow-[0_0_0_3px_rgba(96,165,250,0.15)]"
              : invalid
              ? "border-red-300 dark:border-red-400/50"
              : "border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20"
          )}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            aria-label={revealed ? "Hide password" : "Show password"}
            onClick={() => setPasswordRevealed(!passwordRevealed)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
});
