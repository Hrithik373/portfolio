import { useRef } from 'react'
import { useInView } from 'framer-motion'

/* ──────────────────────────────────────────────
 * Rain variant — unchanged
 * ────────────────────────────────────────────── */

const PETAL_COUNT = 14

const petalData = Array.from({ length: PETAL_COUNT }, (_, i) => ({
  id: i,
  left: `${5 + Math.round((i / PETAL_COUNT) * 88 + (i % 3) * 4)}%`,
  size: 10 + (i % 5) * 3,
  delay: (i * 0.7) % 6,
  duration: 6 + (i % 4) * 2.5,
  sway: 18 + (i % 3) * 12,
  startRotate: -15 + (i % 6) * 10,
}))

const fallKeyframes = `
@keyframes sakura-fall {
  0%   { transform: translateY(-12%) translateX(0px) rotate(var(--start-rot)); opacity: 0; }
  8%   { opacity: 0.7; }
  25%  { transform: translateY(22%) translateX(calc(var(--sway) * 1px)) rotate(calc(var(--start-rot) + 45deg)); }
  50%  { transform: translateY(50%) translateX(calc(var(--sway) * -0.6px)) rotate(calc(var(--start-rot) + 120deg)); opacity: 0.55; }
  75%  { transform: translateY(78%) translateX(calc(var(--sway) * 0.8px)) rotate(calc(var(--start-rot) + 200deg)); }
  92%  { opacity: 0.5; }
  100% { transform: translateY(108%) translateX(calc(var(--sway) * -0.3px)) rotate(calc(var(--start-rot) + 300deg)); opacity: 0; }
}
`

/* ──────────────────────────────────────────────
 * Bloom variant — fully baked CSS keyframes
 *
 * Each petal generates its own unique @keyframes
 * with hardcoded px/deg values. Zero CSS vars,
 * zero framer-motion animate, zero useInView.
 * ────────────────────────────────────────────── */

const bloomPetals = [
  { id: 0, left: '6%',  top: '28%', size: 13, bx: 28, rot: -16, delay: 0,   dur: 5.5 },
  { id: 1, left: '18%', top: '55%', size: 11, bx: 34, rot: 9,   delay: 0.6, dur: 6.2 },
  { id: 2, left: '30%', top: '35%', size: 14, bx: 26, rot: -8,  delay: 1.2, dur: 5.8 },
  { id: 3, left: '42%', top: '68%', size: 11, bx: 38, rot: 14,  delay: 0.3, dur: 6.5 },
  { id: 4, left: '55%', top: '24%', size: 12, bx: 30, rot: -12, delay: 0.9, dur: 5.4 },
  { id: 5, left: '67%', top: '50%', size: 10, bx: 36, rot: 6,   delay: 1.5, dur: 6.8 },
  { id: 6, left: '78%', top: '38%', size: 13, bx: 24, rot: -10, delay: 0.4, dur: 5.9 },
  { id: 7, left: '88%', top: '62%', size: 11, bx: 32, rot: 11,  delay: 1.0, dur: 6.1 },
  { id: 8, left: '12%', top: '78%', size: 10, bx: 28, rot: -5,  delay: 1.8, dur: 5.6 },
  { id: 9, left: '50%', top: '20%', size: 12, bx: 34, rot: 8,   delay: 0.7, dur: 6.4 },
]

/** Build a unique @keyframes block per petal with hardcoded values */
function buildBloomKeyframe(name: string, bx: number, rot: number): string {
  return `
@keyframes ${name} {
  0%   { transform: translate(0px, 0px) scale(0.75) rotate(${rot}deg); opacity: 0.35; }
  14%  { transform: translate(${(bx * 0.9).toFixed(1)}px, -22px) scale(1.18) rotate(${rot + 28}deg); opacity: 0.9; }
  30%  { transform: translate(${(bx * -0.45).toFixed(1)}px, 14px) scale(0.92) rotate(${rot - 12}deg); opacity: 0.7; }
  48%  { transform: translate(${(bx * 0.75).toFixed(1)}px, -18px) scale(1.12) rotate(${rot + 18}deg); opacity: 0.85; }
  64%  { transform: translate(${(bx * -0.6).toFixed(1)}px, 10px) scale(1.0) rotate(${rot - 8}deg); opacity: 0.75; }
  80%  { transform: translate(${(bx * 0.35).toFixed(1)}px, -8px) scale(0.95) rotate(${rot + 10}deg); opacity: 0.65; }
  100% { transform: translate(0px, 0px) scale(0.75) rotate(${rot}deg); opacity: 0.35; }
}`
}

/** All bloom keyframes concatenated into one <style> string */
const bloomCSS = bloomPetals
  .map((p) => buildBloomKeyframe(`pb${p.id}`, p.bx, p.rot))
  .join('\n')

/* ────────────────────────────────────────────── */

export type FloatingCardPetalsVariant = 'rain' | 'bloom'

export function FloatingCardPetals({
  isNight,
  reduced,
  variant = 'rain',
}: {
  isNight: boolean
  reduced: boolean
  variant?: FloatingCardPetalsVariant
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { amount: 0.1, once: false })

  const color = isNight ? 'rgba(245,198,214,0.85)' : 'rgba(236,72,153,0.75)'
  const glow = isNight
    ? '0 0 8px rgba(245,198,214,0.6), 0 0 20px rgba(236,72,153,0.15)'
    : '0 0 6px rgba(236,72,153,0.4), 0 0 16px rgba(245,198,214,0.2)'

  /* ── Bloom ── */
  if (variant === 'bloom') {
    if (reduced) {
      return (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {bloomPetals.slice(0, 5).map((p) => (
            <span
              key={p.id}
              className="absolute select-none"
              style={{
                left: p.left,
                top: p.top,
                fontSize: p.size,
                color,
                textShadow: glow,
                opacity: isNight ? 0.38 : 0.42,
              }}
            >
              ✿
            </span>
          ))}
        </div>
      )
    }

    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <style>{bloomCSS}</style>
        {bloomPetals.map((p) => (
          <span
            key={p.id}
            className="absolute select-none"
            style={{
              left: p.left,
              top: p.top,
              fontSize: p.size,
              lineHeight: 1,
              color,
              textShadow: glow,
              animation: `pb${p.id} ${p.dur}s ${p.delay}s ease-in-out infinite`,
              willChange: 'transform, opacity',
            }}
          >
            ✿
          </span>
        ))}
      </div>
    )
  }

  /* ── Rain (unchanged) ── */
  if (reduced) {
    return (
      <div ref={ref} className="pointer-events-none absolute inset-0" aria-hidden>
        {petalData.slice(0, 5).map((p) => (
          <span
            key={p.id}
            className="absolute select-none"
            style={{ left: p.left, top: '40%', fontSize: p.size, color, textShadow: glow, opacity: 0.3 }}
          >
            ✿
          </span>
        ))}
      </div>
    )
  }

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <style>{fallKeyframes}</style>
      {isInView &&
        petalData.map((p) => (
          <span
            key={p.id}
            className="absolute select-none"
            style={{
              left: p.left,
              top: 0,
              fontSize: p.size,
              lineHeight: 1,
              color,
              textShadow: glow,
              '--sway': p.sway,
              '--start-rot': `${p.startRotate}deg`,
              animation: `sakura-fall ${p.duration}s ${p.delay}s ease-in-out infinite`,
              willChange: 'transform, opacity',
            } as React.CSSProperties}
          >
            ✿
          </span>
        ))}
    </div>
  )
}

/**
 * Section-level sakura rain (unchanged).
 */
export function SectionSakuraRain({ isNight }: { isNight: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { amount: 0.05, once: false })

  const color = isNight ? 'rgba(245,198,214,0.55)' : 'rgba(236,72,153,0.45)'
  const glow = isNight
    ? '0 0 12px rgba(245,198,214,0.4)'
    : '0 0 8px rgba(236,72,153,0.3)'

  const sectionPetals = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    left: `${3 + i * 10}%`,
    size: 14 + (i % 4) * 4,
    delay: i * 0.9,
    duration: 8 + (i % 3) * 3,
    sway: 25 + (i % 4) * 10,
    startRotate: -20 + (i % 5) * 12,
  }))

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 z-[2] overflow-hidden" aria-hidden>
      <style>{fallKeyframes}</style>
      {isInView &&
        sectionPetals.map((p) => (
          <span
            key={p.id}
            className="absolute select-none"
            style={{
              left: p.left,
              top: 0,
              fontSize: p.size,
              lineHeight: 1,
              color,
              textShadow: glow,
              '--sway': p.sway,
              '--start-rot': `${p.startRotate}deg`,
              animation: `sakura-fall ${p.duration}s ${p.delay}s ease-in-out infinite`,
            } as React.CSSProperties}
          >
            ✿
          </span>
        ))}
    </div>
  )
}
