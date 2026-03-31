import { useEffect, useRef } from 'react'

/**
 * Sakura petals that float over the voice note card area.
 *
 * WHY this approach:
 *  - CSS @keyframes with calc(var()) don't resolve inside backdrop-blur containers
 *  - CSS @keyframes with baked values get composited away inside backdrop-blur
 *  - framer-motion animate prop gets composited away inside backdrop-blur
 *  - useInView doesn't fire on absolute-positioned containers inside stacking contexts
 *
 * This component:
 *  1. Renders as a SIBLING overlay (not a child of the glass card)
 *  2. Uses requestAnimationFrame + direct style.transform writes
 *  3. Zero dependencies on CSS animation pipeline or framer-motion
 */

interface PetalConfig {
  x0: number    // start left %
  y0: number    // start top %
  ax: number    // horizontal amplitude px
  ay: number    // vertical amplitude px
  rot0: number  // base rotation deg
  arot: number  // rotation amplitude deg
  freq: number  // speed multiplier
  phase: number // phase offset radians
  size: number  // font size px
}

const PETALS: PetalConfig[] = [
  { x0: 6,  y0: 22, ax: 24, ay: 18, rot0: -16, arot: 30, freq: 0.4,  phase: 0,    size: 13 },
  { x0: 18, y0: 50, ax: 30, ay: 20, rot0: 8,   arot: 25, freq: 0.35, phase: 1.2,  size: 11 },
  { x0: 30, y0: 30, ax: 22, ay: 16, rot0: -8,  arot: 28, freq: 0.38, phase: 2.4,  size: 14 },
  { x0: 42, y0: 65, ax: 32, ay: 22, rot0: 14,  arot: 32, freq: 0.32, phase: 0.8,  size: 11 },
  { x0: 55, y0: 20, ax: 26, ay: 18, rot0: -12, arot: 26, freq: 0.42, phase: 3.6,  size: 12 },
  { x0: 67, y0: 45, ax: 28, ay: 20, rot0: 6,   arot: 24, freq: 0.36, phase: 1.8,  size: 10 },
  { x0: 78, y0: 35, ax: 20, ay: 14, rot0: -10, arot: 22, freq: 0.4,  phase: 4.2,  size: 13 },
  { x0: 88, y0: 58, ax: 26, ay: 18, rot0: 11,  arot: 28, freq: 0.34, phase: 2.8,  size: 11 },
  { x0: 12, y0: 75, ax: 24, ay: 16, rot0: -5,  arot: 20, freq: 0.38, phase: 5.0,  size: 10 },
  { x0: 50, y0: 15, ax: 28, ay: 20, rot0: 8,   arot: 26, freq: 0.36, phase: 3.2,  size: 12 },
]

export function VoiceCardPetals({ isNight }: { isNight: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const spansRef = useRef<HTMLSpanElement[]>([])

  useEffect(() => {
    const spans = spansRef.current
    if (spans.length === 0) return

    let t = 0
    const tick = () => {
      t += 0.016 // ~60fps
      for (let i = 0; i < spans.length; i++) {
        const p = PETALS[i]
        const s = spans[i]
        if (!s) continue

        const phase = t * p.freq + p.phase
        // Lissajous-like path: different frequencies for x vs y
        const dx = Math.sin(phase) * p.ax
        const dy = Math.sin(phase * 1.3 + 0.5) * p.ay
        const rot = p.rot0 + Math.sin(phase * 0.7) * p.arot
        const scale = 0.85 + Math.sin(phase * 0.5 + 1.0) * 0.18
        const opacity = 0.45 + Math.sin(phase * 0.6 + 0.3) * 0.35

        s.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${scale.toFixed(2)}) rotate(${rot.toFixed(1)}deg)`
        s.style.opacity = opacity.toFixed(2)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const color = isNight ? 'rgba(245,198,214,0.85)' : 'rgba(236,72,153,0.75)'
  const glow = isNight
    ? '0 0 8px rgba(245,198,214,0.6), 0 0 20px rgba(236,72,153,0.15)'
    : '0 0 6px rgba(236,72,153,0.4), 0 0 16px rgba(245,198,214,0.2)'

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-3xl"
      aria-hidden
    >
      {PETALS.map((p, i) => (
        <span
          key={i}
          ref={(el) => { if (el) spansRef.current[i] = el }}
          className="absolute select-none"
          style={{
            left: `${p.x0}%`,
            top: `${p.y0}%`,
            fontSize: p.size,
            lineHeight: 1,
            color,
            textShadow: glow,
            willChange: 'transform, opacity',
          }}
        >
          ✿
        </span>
      ))}
    </div>
  )
}
