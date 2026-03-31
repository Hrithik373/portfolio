import { memo, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

import { SakuraCanvas } from '../petals/SakuraCanvas'

export type LoaderProps = {
  onSkip: () => void
  theme: 'night' | 'day'
}

  {/* Change: const startRef = useRef(performance.now()) */}
  {/* To: const startRef = useRef(0) */}

function useElapsedSeconds(active: boolean) {
  const startRef = useRef(performance.now())
  const [seconds, setSeconds] = useState(0.1)

  useEffect(() => {
    if (!active) return
    startRef.current = performance.now()
    const tick = () => {
      setSeconds(Math.max(0.1, (performance.now() - startRef.current) / 1000))
    }
    tick()
    const id = window.setInterval(tick, 400)
    return () => window.clearInterval(id)
  }, [active])

  return seconds
}

const easeOut = [0.22, 1, 0.36, 1] as const

const LoaderInner = function Loader({ onSkip, theme }: LoaderProps) {
  const elapsed = useElapsedSeconds(true)

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: easeOut }}
    >
      {/* Fills this overlay only — not `fixed` at z-10 behind the modal */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <SakuraCanvas reduced={false} theme={theme} layout="embedded" />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70"
          aria-hidden
        />
      </div>

      <div className="relative z-10 flex min-h-dvh w-full flex-col items-center justify-center gap-8 px-6 py-12">
        {/* Falling capsule — bounded box, GPU-friendly transform */}
        <div
          className="relative h-40 w-24 overflow-hidden rounded-full border border-white/[0.08] bg-black/30 shadow-[inset_0_0_32px_rgba(0,0,0,0.55)]"
          aria-hidden
        >
          <motion.div
            className="absolute inset-x-0 top-4 mx-auto h-12 w-8 rounded-full bg-gradient-to-b from-sakura-pink/90 via-sakura-pink/40 to-transparent shadow-[0_0_24px_rgba(245,198,214,0.45)]"
            initial={{ y: 0 }}
            animate={{ y: [0, 96, 0] }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: [0.45, 0, 0.55, 1],
            }}
          />
        </div>

        {/* Simple orbit petals — offset start so they don't stack on frame 1 */}
        <div className="relative h-24 w-40 shrink-0" aria-hidden>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <motion.span
                className="block h-6 w-3.5 rounded-full bg-gradient-to-b from-sakura-pink/80 via-sakura-pink/35 to-transparent shadow-[0_0_12px_rgba(245,198,214,0.4)]"
                initial={{ opacity: 0.2, scale: 0.75 }}
                animate={{
                  opacity: [0.2, 0.9, 0.2],
                  /* FIX: all arrays need 3 keyframes to loop without snapping.
                     [0, -56] would jump from -56 back to 0 on repeat.
                     [0, -56, 0] eases back smoothly. Same for x, rotate, scale. */
                  y: [0, -56, 0],
                  x: [0, (index % 2 === 0 ? -1 : 1) * (14 + index * 3), 0],
                  rotate: [-8, 12, -8],
                  scale: [0.75, 1, 0.75],
                }}
                transition={{
                  duration: 2.4,
                  delay: index * 0.32,
                  repeat: Infinity,
                  ease: easeOut,
                }}
              />
            </div>
          ))}
        </div>

        <motion.h1
          className="max-w-[90vw] text-center font-heading text-3xl tracking-[0.28em] text-parchment/95 md:text-4xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.9, ease: easeOut }}
        >
          HRITHIK&nbsp;GHOSH
        </motion.h1>

        <motion.p
          className="text-xs uppercase tracking-[0.32em] text-sakura-pink/85"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.75, ease: 'easeOut' }}
        >
          Crafting calm experiences
        </motion.p>

        <p className="text-[0.65rem] uppercase tracking-[0.26em] text-parchment/55">Loading sakura scene</p>
        <p className="tabular-nums text-[0.72rem] font-medium text-parchment/80">{elapsed.toFixed(1)}s</p>

        <button
          type="button"
          onClick={onSkip}
          className="mt-2 rounded-md px-2 py-1 text-xs text-parchment/45 underline-offset-4 transition-colors hover:text-parchment/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura-pink/70"
        >
          Skip intro
        </button>
      </div>
    </motion.div>
  )
}

export const Loader = memo(LoaderInner)
Loader.displayName = 'Loader'