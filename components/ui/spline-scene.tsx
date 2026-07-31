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

export function SplineScene({ scene, className = '' }: SplineSceneProps) {
  return (
    <Spline scene={scene} className={className} />
  )
}
