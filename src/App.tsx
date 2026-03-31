import { lazy, Suspense } from 'react'

import { useIsMobile } from './hooks/useIsMobile'

const DesktopPortfolio = lazy(() => import('./pages/DesktopPortfolio'))
const MobilePortfolio = lazy(() => import('./pages/MobilePortfolio'))

function App() {
  const isMobile = useIsMobile()

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-black">
          <span className="font-heading text-sm tracking-[0.3em] text-parchment/60">Loading…</span>
        </div>
      }
    >
      {isMobile ? <MobilePortfolio /> : <DesktopPortfolio />}
    </Suspense>
  )
}

export default App
