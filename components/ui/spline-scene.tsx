'use client'
import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { Application } from '@splinetool/runtime'

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
// This instead pauses/resumes the render loop in place via the Application
// instance's own stop()/play() — same CPU saving while offscreen or
// backgrounded, but never unmounts, so there's no reload/stutter.
export function SplineScene({ scene, className = '' }: SplineSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !document.hidden) appRef.current?.play()
        else appRef.current?.stop()
      },
      { rootMargin: '200px' }
    )
    observer.observe(container)

    const onVisibilityChange = () => {
      if (document.hidden) {
        appRef.current?.stop()
      } else if (container.getBoundingClientRect().top < window.innerHeight + 200) {
        appRef.current?.play()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return (
    <div ref={containerRef} className={className}>
      <Spline scene={scene} onLoad={(app) => { appRef.current = app }} />
    </div>
  )
}
