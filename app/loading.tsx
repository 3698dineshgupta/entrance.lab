import { GraduationCap } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/20">
          <div className="absolute inset-0 rounded-2xl border-2 border-white/20 animate-ping" />
          <GraduationCap className="h-8 w-8 text-white animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Entrance<span className="text-blue-400">Lab</span>
          </h2>
          <p className="text-sm text-muted-foreground animate-pulse mt-1">Loading...</p>
        </div>
      </div>
    </div>
  );
}
