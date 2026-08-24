import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#4F6BFF]/40 animate-ping" />
          <Image src="/brain-logo-mark.png" alt="EntranceLab" fill sizes="64px" className="object-contain animate-pulse" priority />
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
