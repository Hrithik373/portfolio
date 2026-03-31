import { motion, useReducedMotion } from 'framer-motion'

type Props = { isNight: boolean }

/**
 * Subtle ensō-inspired rings, slow seigaiha drift, and a vertical ink line — hero-only, respects reduced motion.
 */
export function HeroJapaneseMotifs({ isNight }: Props) {
  const reduced = useReducedMotion() ?? false
  const ring = isNight ? 'rgba(245,198,214,0.22)' : 'rgba(180,100,115,0.2)'
  const dash = isNight ? 'rgba(245,198,214,0.14)' : 'rgba(170,95,110,0.14)'
  const wave = isNight ? 'rgba(245,198,214,0.22)' : 'rgba(150,85,100,0.18)'
  const wash = isNight ? 'rgba(245,198,214,0.05)' : 'rgba(200,130,145,0.06)'

  return (
    <div className="pointer-events-none absolute inset-0 -z-[6] overflow-hidden" aria-hidden>
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 90% 45% at 50% -15%, ${wash}, transparent 50%)`,
        }}
        animate={reduced ? undefined : { opacity: [0.65, 1, 0.7] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute -left-[18%] top-[18%] h-[min(68vh,600px)] w-[min(68vh,600px)] rounded-full border opacity-[0.08]"
        style={{ borderColor: ring }}
        animate={reduced ? undefined : { scale: [1, 1.025, 1], rotate: [0, 3, 0] }}
        transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-[12%] bottom-[8%] h-[min(52vh,440px)] w-[min(52vh,440px)] rounded-full border border-dashed opacity-[0.06]"
        style={{ borderColor: dash }}
        animate={reduced ? undefined : { scale: [1, 1.04, 1], rotate: [0, -5, 0] }}
        transition={{ duration: 40, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute inset-0 opacity-[0.035] sm:opacity-[0.045]"
        style={{
          backgroundImage: `repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 15px, ${wave} 15px, ${wave} 16px)`,
          backgroundSize: '48px 48px',
        }}
        animate={reduced ? undefined : { backgroundPosition: ['0% 0%', '48px 48px'] }}
        transition={{ duration: 100, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        className={`absolute bottom-[16%] left-[6%] top-[26%] w-px origin-top sm:left-[8%] lg:left-[4%] ${
          isNight ? 'bg-gradient-to-b from-sakura-pink/30 via-sakura-pink/12 to-transparent' : 'bg-gradient-to-b from-rose-500/28 via-rose-400/12 to-transparent'
        }`}
        initial={{ scaleY: reduced ? 1 : 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1.15, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
      />

      {!reduced && (
        <>
          <motion.span
            className={`absolute right-[10%] top-[22%] font-jp-hand text-lg opacity-[0.07] sm:text-xl ${isNight ? 'text-sakura-pink' : 'text-rose-600'}`}
            animate={{ y: [0, -10, 0], opacity: [0.05, 0.1, 0.05], rotate: [0, -4, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          >
            桜
          </motion.span>
          <motion.span
            className={`absolute bottom-[24%] right-[14%] text-sm opacity-[0.06] sm:text-base ${isNight ? 'text-sakura-pink' : 'text-rose-500'}`}
            aria-hidden
            animate={{ y: [0, 8, 0], opacity: [0.04, 0.09, 0.04] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          >
            ✿
          </motion.span>
        </>
      )}
    </div>
  )
}
