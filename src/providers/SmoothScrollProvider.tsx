import { useEffect } from 'react'
import Lenis from '@studio-freight/lenis'
import { useIsMobile } from '../hooks/useIsMobile'

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()

  useEffect(() => {
    if (isMobile) return

    const lenis = new Lenis({
      lerp: 0.12,
      smoothWheel: true,
      wheelMultiplier: 0.8,
      touchMultiplier: 1.5,
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    const frame = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [isMobile])

  return <>{children}</>
}
