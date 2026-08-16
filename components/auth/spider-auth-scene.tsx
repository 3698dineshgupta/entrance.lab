"use client";
import { SpiderAuthProvider, useSpiderAuth } from "./spider-scene-context";
import { SpiderWeb } from "./spider-web";
import { SpiderWebTrail } from "./spider-web-trail";
import { SpiderMascot } from "./spider-mascot";
import { BrandPanel } from "./brand-panel";

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

function SceneInner({ children }: { children: React.ReactNode }) {
  const { sceneRef } = useSpiderAuth();
  return (
    <div
      ref={sceneRef}
      className="relative flex flex-1 items-center justify-center overflow-hidden bg-white px-6 py-12 sm:px-10 lg:px-14 dark:bg-[#0A1020]"
    >
      <SpiderWeb />
      {children}
      <SpiderWebTrail />
      <SpiderMascot />
    </div>
  );
}

// Split-screen auth shell: a gradient brand panel (left, desktop-only) next
// to a white panel (right) that hosts the form plus the whole spider/web
// interaction layer. Everything spider-related lives inside the white panel
// only — the two halves have very different backgrounds, and keeping the
// mascot confined to one avoids it ever needing to cross that hard visual
// seam.
export function SpiderAuthScene({
  brandHeading,
  brandDescription,
  features,
  children,
}: {
  brandHeading: string;
  brandDescription: string;
  features: FeatureItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 px-4 py-8 dark:from-[#050816] dark:via-[#070b14] dark:to-[#0a0f1f] sm:py-12">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] shadow-2xl shadow-blue-950/10 dark:shadow-black/50 lg:grid-cols-2">
        <BrandPanel heading={brandHeading} description={brandDescription} features={features} />
        <SpiderAuthProvider>
          <SceneInner>{children}</SceneInner>
        </SpiderAuthProvider>
      </div>
    </div>
  );
}
