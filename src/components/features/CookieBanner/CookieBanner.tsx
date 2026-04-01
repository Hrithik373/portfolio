import { AnimatePresence, motion } from 'framer-motion'
import { useCookieConsent } from '../../../context/CookieConsentContext'

export function CookieBanner() {
  const { bannerOpen, consent, accept, deny } = useCookieConsent()
  const visible = bannerOpen

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop — subtle, doesn't block scrolling */}
          <motion.div
            className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            aria-hidden
          />

          {/* Banner panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-title"
            className="fixed inset-x-0 bottom-0 z-[71] px-4 pb-[env(safe-area-inset-bottom,0px)]"
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '110%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 34, mass: 0.9 }}
          >
            <div className="mx-auto mb-4 max-w-2xl overflow-hidden rounded-2xl border border-white/[0.13] bg-[#09090f]/92 shadow-[0_-8px_60px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl">

              {/* Top accent line */}
              <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(245,198,214,0.7) 40%, rgba(138,181,192,0.5) 70%, transparent 100%)' }} />

              <div className="p-5">
                {/* Header */}
                <div className="mb-3 flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-sakura-pink/20 bg-sakura-pink/[0.07]">
                    <svg className="h-4 w-4 text-sakura-pink/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
                    </svg>
                  </span>
                  <div>
                    <h2 id="cookie-title" className="font-heading text-sm text-parchment/95">Privacy & Security Notice</h2>
                    <p className="mt-0.5 text-[0.6rem] uppercase tracking-[0.2em] text-sakura-pink/70">一期一会 · Your data, your choice</p>
                  </div>
                </div>

                {/* Policy text */}
                <div className="mb-4 space-y-2 text-[0.73rem] leading-relaxed text-parchment/70">
                  <p>
                    This site collects your <strong className="text-parchment/90">IP address</strong> and a <strong className="text-parchment/90">device fingerprint</strong> strictly for security — to prevent spam and abuse on contact forms and voice notes.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <PolicyPill icon="🗑️" text="Auto-deleted every 12 hours" />
                    <PolicyPill icon="🔒" text="Security use only" />
                    <PolicyPill icon="🚫" text="No advertising. No analytics." />
                    <PolicyPill icon="🌐" text="Never sold or shared" />
                  </div>
                  {consent === 'denied' && (
                    <p className="mt-1 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2 text-amber-300/80">
                      You previously declined — features like voice notes and contact forms are currently unavailable.
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={deny}
                    className="order-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-[0.73rem] font-medium tracking-wide text-parchment/55 transition-colors hover:bg-white/[0.08] hover:text-parchment/75 active:scale-95 sm:order-1"
                  >
                    Decline — limit features
                  </button>
                  <button
                    type="button"
                    onClick={accept}
                    className="order-1 rounded-xl border border-sakura-pink/40 bg-sakura-pink/[0.12] px-5 py-2.5 text-[0.73rem] font-semibold tracking-wide text-sakura-pink shadow-[0_0_16px_rgba(245,198,214,0.15)] transition-all hover:bg-sakura-pink/[0.2] hover:shadow-[0_0_24px_rgba(245,198,214,0.3)] active:scale-95 sm:order-2"
                  >
                    Accept — enable all features
                  </button>
                </div>

                {/* Footnote */}
                <p className="mt-3 text-[0.58rem] text-parchment/30">
                  Your choice is saved locally and can be changed at any time. Data is only processed on our secure Render backend — no third-party trackers.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function PolicyPill({ icon, text }: { icon: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[0.62rem] text-parchment/60">
      <span aria-hidden>{icon}</span>
      {text}
    </span>
  )
}
