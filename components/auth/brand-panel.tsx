import { GraduationCap } from "lucide-react";

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

interface BrandPanelProps {
  heading: string;
  description: string;
  features: FeatureItem[];
}

// Static (no spider logic here) — the left half of the split auth layout.
// Hidden below lg: a stacked brand panel above a full-width form doesn't add
// much on a short mobile viewport, so the form gets the whole screen there.
export function BrandPanel({ heading, description, features }: BrandPanelProps) {
  return (
    <div className="relative hidden flex-col justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-10 py-14 lg:flex xl:px-14">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" aria-hidden="true" />

      <div className="relative z-10">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
          <GraduationCap className="h-8 w-8 text-white" />
        </span>
        <h1 className="mt-8 text-4xl font-bold tracking-tight text-white">{heading}</h1>
        <p className="mt-4 max-w-sm leading-relaxed text-blue-100/90">{description}</p>

        <div className="mt-10 space-y-3">
          {features.map((f) => (
            <div key={f.title} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3.5 backdrop-blur-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
                {f.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{f.title}</p>
                <p className="text-xs text-blue-100/80">{f.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
