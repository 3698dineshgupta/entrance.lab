'use client'
import { useEffect, useRef, useState } from 'react'
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(true) // Default true so it begins loading immediately at the top

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
      },
      { rootMargin: '200px' } // Unmount when it's more than 200px out of view
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className={className}>
      {inView ? <Spline scene={scene} /> : null}
    </div>
  )
}
