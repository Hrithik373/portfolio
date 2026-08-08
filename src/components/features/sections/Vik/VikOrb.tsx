import { motion } from 'framer-motion'

const softLoop = [0.45, 0, 0.55, 1] as const

export type VikBackendStatus = 'checking' | 'online' | 'offline'

const statusDotColor: Record<VikBackendStatus, string> = {
  checking: 'bg-amber-400/90',
  online: 'bg-emerald-400/90',
  offline: 'bg-rose-500/90',
}

/**
 * Vik's avatar orb — originally built inline for the BlogPost "flagship
 * program" teaser card (before Vik existed for real); now owned here so
 * both that teaser and the live Vik section can use the same visual.
 */
export function VikOrb({
  isNight,
  reduced,
  status,
}: {
  isNight: boolean
  reduced: boolean
  /** Live backend connectivity dot — omit to render the plain decorative orb (e.g. in the BlogPost teaser). */
  status?: VikBackendStatus
}) {
  const nightGrad =
    'radial-gradient(circle at 35% 30%, rgba(167,139,250,0.55) 0%, rgba(56,189,248,0.35) 42%, rgba(15,23,42,0.95) 72%)'
  const dayGrad =
    'radial-gradient(circle at 35% 30%, rgba(244,114,182,0.5) 0%, rgba(251,191,36,0.28) 45%, rgba(255,255,255,0.92) 70%)'
  return (
    <div className="relative flex h-[5rem] w-[5rem] shrink-0 items-center justify-center sm:h-[5.5rem] sm:w-[5.5rem]">
      <motion.div
        className="absolute inset-[-20%] rounded-full blur-2xl"
        style={{ background: isNight ? 'rgba(129,140,248,0.35)' : 'rgba(244,114,182,0.32)' }}
        animate={reduced ? { opacity: 0.4 } : { opacity: [0.32, 0.55, 0.32], scale: [1, 1.04, 1] }}
        transition={{ duration: 5, repeat: reduced ? 0 : Infinity, ease: softLoop }}
        aria-hidden
      />
      <motion.div
        className="relative h-[4.25rem] w-[4.25rem] rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] ring-1 ring-white/15 sm:h-[4.75rem] sm:w-[4.75rem]"
        style={{ background: isNight ? nightGrad : dayGrad }}
        animate={
          reduced
            ? {}
            : {
                boxShadow: isNight
                  ? [
                      '0 0 0 0 rgba(129,140,248,0)',
                      '0 0 36px 6px rgba(56,189,248,0.22)',
                      '0 0 0 0 rgba(129,140,248,0)',
                    ]
                  : [
                      '0 0 0 0 rgba(244,114,182,0)',
                      '0 0 40px 8px rgba(251,191,36,0.2)',
                      '0 0 0 0 rgba(244,114,182,0)',
                    ],
              }
        }
        transition={{ duration: 3.5, repeat: reduced ? 0 : Infinity, ease: softLoop }}
      />
      <motion.span
        className={`relative z-10 font-heading text-[0.68rem] font-semibold uppercase tracking-[0.32em] ${
          isNight ? 'text-white/92' : 'text-[color:var(--dawn-text)]'
        }`}
        animate={reduced ? {} : { opacity: [0.82, 1, 0.82] }}
        transition={{ duration: 3.2, repeat: reduced ? 0 : Infinity, ease: softLoop }}
      >
        Vik
      </motion.span>
      {status && (
        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ${
            isNight ? 'ring-black/70' : 'ring-white/90'
          } ${statusDotColor[status]}`}
          aria-hidden
        />
      )}
    </div>
  )
}
