'use client'
import { Suspense, lazy, useEffect, useState } from 'react'
// Revert to standard React.lazy to avoid Next.js module resolution bugs with this specific package's exports
const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({
  scene,
  className = '',
}: SplineSceneProps) {
  // Defer loading to improve initial paint speed
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShouldLoad(true), 200)
    return () => clearTimeout(timer)
  }, [])

  if (!shouldLoad) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <span className="loader" aria-label="Loading 3D scene" />
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center">
          <span className="loader" aria-label="Loading 3D scene" />
        </div>
      }
    >
      <Spline scene={scene} className={className} />
    </Suspense>
  )
}
