import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

type NavbarPetalRnd = {
  startLeft: number
  startTop: number
  endLeft: number
  endTop: number
  duration: number
  rotate: [number, number, number, number]
}

function spawnPetalRnd(): NavbarPetalRnd {
  // Plant in header: start along the nav bar (top edge)
  const startLeft = 10 + Math.random() * 80
  const startTop = -2 + Math.random() * 25
  // Fall downward from the header into the page
  const endLeft = startLeft + (Math.random() - 0.5) * 50
  const endTop = 120 + Math.random() * 100
  return {
    startLeft,
    startTop,
    endLeft,
    endTop,
    duration: 3.5 + Math.random() * 2,
    rotate: [-12, 4 + Math.random() * 6, 6 + Math.random() * 6, 4],
  }
}

// Sakura petals planted in the header: drift down from the nav bar. Spawn on nav click + every ~3.5s; keep a few in flight.
export function NavbarPetal({
  reduced,
  theme,
  triggerFromParent = 0,
}: {
  reduced: boolean
  theme: 'night' | 'day'
  triggerFromParent?: number
}) {
  const [petals, setPetals] = useState<Array<{ key: number; rnd: NavbarPetalRnd }>>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevTriggerRef = useRef(0)
  const isNight = theme === 'night'
  const maxPetals = 4

  const spawn = () => {
    setPetals((prev) => {
      const next = [...prev, { key: Date.now() + Math.random(), rnd: spawnPetalRnd() }].slice(-maxPetals)
      return next
    })
  }

  // Nav click: spawn a petal from the header (defer to avoid sync setState in effect)
  useEffect(() => {
    if (reduced || triggerFromParent === 0) return
    if (triggerFromParent !== prevTriggerRef.current) {
      prevTriggerRef.current = triggerFromParent
      const t = setTimeout(() => spawn(), 0)
      return () => clearTimeout(t)
    }
  }, [reduced, triggerFromParent])

  // Initial spawn + interval so petals keep falling from the header
  useEffect(() => {
    if (reduced) return
    const t0 = setTimeout(() => spawn(), 400)
    intervalRef.current = setInterval(spawn, 3500)
    return () => {
      clearTimeout(t0)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [reduced])

  if (reduced) return null

  return (
    <div className="absolute inset-0 overflow-visible" aria-hidden="true">
      {petals.map(({ key, rnd }) => (
        <motion.div
          key={key}
          className="absolute h-6 w-6 sm:h-7 sm:w-7"
          style={{ filter: 'blur(1px)' }}
          initial={{ left: `${rnd.startLeft}%`, top: `${rnd.startTop}%`, opacity: 0, rotate: -12 }}
          animate={{
            left: `${rnd.endLeft}%`,
            top: `${rnd.endTop}%`,
            opacity: [0, 0.28, 0.28, 0],
            rotate: rnd.rotate,
          }}
          transition={{
            duration: rnd.duration,
            ease: 'linear',
            opacity: { times: [0, 0.1, 0.88, 1] },
          }}
        >
          <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id={`navPetalGradient-${key}`} cx="50%" cy="10%" r="80%">
                <stop offset="0%" stopColor={isNight ? '#fef6fb' : '#ffeef7'} stopOpacity={0.9} />
                <stop offset="100%" stopColor={isNight ? '#f5c6d6' : '#f9bcd6'} stopOpacity={0.5} />
              </radialGradient>
            </defs>
            <path
              d="M50 10 C47 16 44 22 46 27 C48 32 52 32 54 27 C56 22 53 16 50 10 Z"
              fill={`url(#navPetalGradient-${key})`}
            />
          </svg>
        </motion.div>
      ))}
    </div>
  )
}
