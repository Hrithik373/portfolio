import { lazy, Suspense } from 'react'

import { useIsMobile } from './hooks/useIsMobile'
import { CookieConsentProvider } from './context/CookieConsentContext'
import { CookieBanner } from './components/features/CookieBanner/CookieBanner'
import { PrivacyReminderFAB } from './components/features/CookieBanner/PrivacyReminderFAB'

const DesktopPortfolio = lazy(() => import('./pages/DesktopPortfolio'))
const MobilePortfolio = lazy(() => import('./pages/MobilePortfolio'))

function App() {
  const isMobile = useIsMobile()

  return (
    <CookieConsentProvider>
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center bg-black">
            <span className="font-heading text-sm tracking-[0.3em] text-parchment/60">Loading…</span>
          </div>
        }
      >
        {isMobile ? <MobilePortfolio /> : <DesktopPortfolio />}
      </Suspense>
      <CookieBanner />
      <PrivacyReminderFAB />
    </CookieConsentProvider>
  )
}

export default App
