import { useCookieConsent } from '../../../context/CookieConsentContext'

interface FeatureLockedProps {
  /** Feature name shown in the message */
  feature: string
  theme?: 'night' | 'day'
  children: React.ReactNode
  /** Extra classes for the wrapper div */
  className?: string
}

/**
 * Wraps a feature component and overlays a locked state when the user
 * has explicitly denied cookie consent.
 *
 * When consent is null (pending) OR accepted, children render normally.
 */
export function FeatureLocked({ feature, theme = 'night', children, className }: FeatureLockedProps) {
  const { consent, reopen } = useCookieConsent()

  if (consent !== 'denied') {
    return <div className={className}>{children}</div>
  }

  const isNight = theme === 'night'

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className ?? ''}`}>
      {/* Blurred ghost of the underlying feature */}
      <div className="pointer-events-none select-none opacity-25 blur-[3px]" aria-hidden>
        {children}
      </div>

      {/* Locked overlay */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl p-6 text-center ${
          isNight
            ? 'bg-black/75 backdrop-blur-md'
            : 'bg-white/70 backdrop-blur-md'
        }`}
      >
        {/* Lock icon */}
        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
          isNight ? 'border-parchment/15 bg-white/[0.05]' : 'border-stone-200 bg-white/60'
        }`}>
          <svg className={`h-5 w-5 ${isNight ? 'text-parchment/50' : 'text-stone-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
          </svg>
        </span>

        {/* Message */}
        <div className="space-y-1">
          <p className={`font-heading text-sm ${isNight ? 'text-parchment/80' : 'text-stone-700'}`}>
            {feature} unavailable
          </p>
          <p className={`text-[0.68rem] leading-relaxed ${isNight ? 'text-parchment/45' : 'text-stone-500'}`}>
            You declined data collection. No IP or device data is being stored.
            <br />
            Enable cookies to restore this feature.
          </p>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={reopen}
          className={`mt-1 rounded-full border px-4 py-2 text-[0.68rem] font-medium tracking-wide transition-colors active:scale-95 ${
            isNight
              ? 'border-sakura-pink/30 bg-sakura-pink/[0.08] text-sakura-pink/80 hover:bg-sakura-pink/[0.16]'
              : 'border-rose-300/60 bg-rose-50 text-rose-600 hover:bg-rose-100'
          }`}
        >
          Review cookie settings
        </button>
      </div>
    </div>
  )
}
