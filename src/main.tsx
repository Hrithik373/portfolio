import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import Lenis from '@studio-freight/lenis'
import './index.css'
import App from './App.tsx'
import { useIsMobile } from './hooks/useIsMobile.ts'

function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()

  useEffect(() => {
    if (isMobile) return

    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SmoothScrollProvider>
      <App />
    </SmoothScrollProvider>
  </StrictMode>,
)
