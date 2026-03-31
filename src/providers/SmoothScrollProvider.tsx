import { useEffect } from 'react'
import Lenis from '@studio-freight/lenis'
import { connectLenisToGSAP, ScrollTrigger } from '../lib/gsap-setup'

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 0.8,
      touchMultiplier: 1.5,
    })

    connectLenisToGSAP(lenis)

    return () => {
      lenis.destroy()
      ScrollTrigger.getAll().forEach(t => t.kill())
    }
  }, [])

  return <>{children}</>
}
