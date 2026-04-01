import { AnimatePresence, motion } from 'framer-motion'
import { useCookieConsent } from '../../../context/CookieConsentContext'

export function PrivacyReminderFAB() {
  const { consent, bannerOpen, reopen } = useCookieConsent()

  // Only show when user has actively declined and the banner is closed
  const visible = consent === 'denied' && !bannerOpen

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={reopen}
          title="Review cookie & privacy settings"
          className="fixed bottom-5 right-5 z-[69] flex items-center gap-2 rounded-full border border-white/[0.12] bg-[#09090f]/90 px-3.5 py-2 text-[0.62rem] font-medium tracking-wide text-parchment/55 shadow-[0_4px_24px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-colors hover:border-sakura-pink/30 hover:text-sakura-pink/80"
          initial={{ opacity: 0, scale: 0.8, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 12 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
          </svg>
          Features limited
        </motion.button>
      )}
    </AnimatePresence>
  )
}
