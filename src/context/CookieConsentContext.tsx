import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { getConsent, setConsent, type ConsentState } from '../lib/cookie-consent'

interface CookieConsentCtx {
  consent: ConsentState
  /** Whether the banner is currently visible */
  bannerOpen: boolean
  accept: () => void
  deny: () => void
  /** Re-open the banner to let user change their choice */
  reopen: () => void
}

const CookieConsentContext = createContext<CookieConsentCtx>({
  consent: null,
  bannerOpen: false,
  accept: () => {},
  deny: () => {},
  reopen: () => {},
})

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsentState] = useState<ConsentState>(null)
  const [bannerOpen, setBannerOpen] = useState(false)

  useEffect(() => {
    const stored = getConsent()
    setConsentState(stored)
    // Show banner on first visit (no prior choice)
    if (stored === null) setBannerOpen(true)
  }, [])

  const accept = useCallback(() => {
    setConsent('accepted')
    setConsentState('accepted')
    setBannerOpen(false)
  }, [])

  const deny = useCallback(() => {
    setConsent('denied')
    setConsentState('denied')
    setBannerOpen(false)
  }, [])

  const reopen = useCallback(() => {
    setBannerOpen(true)
  }, [])

  return (
    <CookieConsentContext.Provider value={{ consent, bannerOpen, accept, deny, reopen }}>
      {children}
    </CookieConsentContext.Provider>
  )
}

export function useCookieConsent() {
  return useContext(CookieConsentContext)
}
