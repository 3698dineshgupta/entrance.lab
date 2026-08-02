'use client'
import dynamic from 'next/dynamic'

// Use Next.js dynamic import with SSR disabled to prevent WebGL hydration crashes on refresh
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
    </div>
  ),
})

interface SplineSceneProps {
  scene: string
  className?: string
}

// Mounted once by the caller (Hero gates this to desktop only) and left
// mounted for the page's lifetime — it previously unmounted/remounted on
// every scroll past a 200px margin via IntersectionObserver, which meant
// reloading the whole WebGL scene from scratch (visible stutter) every time
// it scrolled back into view, on top of the ongoing render-loop CPU cost.
export function SplineScene({ scene, className = '' }: SplineSceneProps) {
  return (
    <div className={className}>
      <Spline scene={scene} />
    </div>
  )
}
