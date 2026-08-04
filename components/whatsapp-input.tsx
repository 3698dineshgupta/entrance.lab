"use client";
import { Label } from "@/components/ui/label";

interface Props {
  id: string;
  value: string; // local 10-digit part only, no country code
  onChange: (v: string) => void;
  required?: boolean;
  hint?: string;
}

export function WhatsAppInput({ id, value, onChange, required, hint }: Props) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>WhatsApp number</Label>
      <div className="flex rounded-lg border border-white/10 bg-white/[0.03] overflow-hidden focus-within:ring-2 focus-within:ring-ring">
        <span className="flex items-center pl-3 pr-2 text-sm text-muted-foreground border-r border-white/10 select-none">
          +977
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="98XXXXXXXX"
          required={required}
          className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
