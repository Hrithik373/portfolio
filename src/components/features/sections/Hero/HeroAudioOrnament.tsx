import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef } from 'react'

import type { SectionProps } from '../SectionTypes'

const PETALS = 16
const CENTER_BARS = 11

type Props = Pick<SectionProps, 'theme'> & {
  stream: MediaStream | null
  /** True while voice note is actively recording */
  live: boolean
}

/**
 * Japanese-themed audio-reactive art inside the hero orb: ring of sakura + central ink bars, driven by mic FFT or gentle idle motion.
 */
export function HeroAudioOrnament({ theme, stream, live }: Props) {
  const isNight = theme === 'night'
  const reduced = useReducedMotion() ?? false
  const petalRefs = useRef<(HTMLSpanElement | null)[]>([])
  const barRefs = useRef<(HTMLDivElement | null)[]>([])
  const ringRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    let audioCtx: AudioContext | null = null
    let analyser: AnalyserNode | null = null
    let freqBuf: Uint8Array | null = null

    const setupLive = async () => {
      if (!stream || !live) return
      const ctx = new AudioContext()
      await ctx.resume().catch(() => {})
      if (cancelled) {
        void ctx.close().catch(() => {})
        return
      }
      const src = ctx.createMediaStreamSource(stream)
      const an = ctx.createAnalyser()
      an.fftSize = 512
      an.smoothingTimeConstant = 0.68
      src.connect(an)
      audioCtx = ctx
      analyser = an
      freqBuf = new Uint8Array(an.frequencyBinCount)
    }

    const updateVisuals = (t: number, buf: Uint8Array | null) => {
      const petals = petalRefs.current
      const bars = barRefs.current
      const n = PETALS

      for (let i = 0; i < n; i++) {
        const el = petals[i]
        if (!el) continue
        const baseDeg = (360 / n) * i - 90
        let energy = 0.35
        if (buf && !reduced) {
          const lo = Math.floor((i / n) * buf.length * 0.88)
          const hi = Math.floor(((i + 1) / n) * buf.length * 0.88)
          for (let j = lo; j < hi; j++) energy = Math.max(energy, (buf[j] ?? 0) / 255)
        } else if (!buf) {
          energy = 0.35 + 0.2 * Math.sin(t * 1.1 + i * 0.45)
        } else {
          const lo = Math.floor((i / n) * buf.length * 0.88)
          energy = 0.35 + 0.45 * ((buf[lo] ?? 0) / 255)
        }
        const scale = 0.5 + energy * 0.95
        const wobble = reduced ? 0 : Math.sin(t * 1.8 + i * 0.5) * 10 * energy
        el.style.transform = `translate(-50%, -50%) rotate(${baseDeg + wobble}deg) translateY(-118%) scale(${scale})`
        el.style.opacity = String(0.2 + energy * 0.65)
      }

      const bn = CENTER_BARS
      for (let i = 0; i < bn; i++) {
        const el = bars[i]
        if (!el) continue
        let h = 18
        if (buf && !reduced) {
          const mid = Math.floor(buf.length * 0.15)
          const span = Math.floor(buf.length * 0.5)
          const idx = mid + Math.floor((i / bn) * span)
          const v = (buf[idx] ?? 0) / 255
          h = 12 + v * 88
        } else if (!buf) {
          h = 14 + (0.5 + 0.5 * Math.sin(t * 2.2 + i * 0.55)) * 28
        } else {
          const idx = Math.floor((i / bn) * buf.length * 0.45)
          h = 14 + ((buf[idx] ?? 0) / 255) * 72
        }
        el.style.height = `${h}%`
        el.style.opacity = String(0.35 + (h / 100) * 0.55)
      }

      const ring = ringRef.current
      if (ring) {
        let avg = 0.2
        if (buf) {
          let s = 0
          const m = Math.min(48, buf.length)
          for (let i = 0; i < m; i++) s += buf[i] ?? 0
          avg = s / m / 255
        } else {
          avg = 0.22 + 0.08 * Math.sin(t * 1.4)
        }
        const spread = reduced ? 1 : 1 + avg * 0.14
        ring.style.transform = `translate(-50%, -50%) scale(${spread})`
        ring.style.opacity = String(0.12 + avg * 0.35)
      }
    }

    const loop = () => {
      if (cancelled) return
      const t = performance.now() / 1000
      if (analyser && freqBuf) {
        analyser.getByteFrequencyData(freqBuf as Uint8Array<ArrayBuffer>)
        updateVisuals(t, freqBuf)
      } else {
        updateVisuals(t, null)
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    if (live && stream) {
      void setupLive()
        .then(() => {
          if (!cancelled) loop()
        })
        .catch(() => {
          if (!cancelled) loop()
        })
    } else {
      loop()
    }

    return () => {
      cancelled = true
      cancelAnimationFrame(rafRef.current)
      analyser = null
      freqBuf = null
      void audioCtx?.close().catch(() => {})
    }
  }, [live, stream, reduced])

  const petalClass = isNight
    ? 'text-sakura-pink/90 drop-shadow-[0_0_12px_rgba(245,198,214,0.45)]'
    : 'text-rose-400/85 drop-shadow-[0_0_10px_rgba(244,114,182,0.35)]'

  const barClass = isNight
    ? 'bg-gradient-to-t from-sakura-pink/90 via-sakura-pink/45 to-pink-100/15'
    : 'bg-gradient-to-t from-rose-500/90 via-rose-400/50 to-pink-100/25'

  return (
    <div className="pointer-events-none absolute inset-0 z-[3] overflow-hidden rounded-full" aria-hidden>
      <div
        ref={ringRef}
        className={`absolute left-1/2 top-1/2 h-[78%] w-[78%] rounded-full border ${
          isNight ? 'border-sakura-pink/25' : 'border-rose-300/35'
        }`}
        style={{ transform: 'translate(-50%, -50%) scale(1)' }}
      />
      {Array.from({ length: PETALS }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            petalRefs.current[i] = el
          }}
          className={`absolute left-1/2 top-1/2 text-lg sm:text-xl ${petalClass}`}
          style={{
            transform: 'translate(-50%, -50%) rotate(-90deg) translateY(-118%) scale(0.65)',
          }}
        >
          ✿
        </span>
      ))}

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-[42%] max-h-[11rem] min-h-[6rem] w-auto items-end justify-center gap-1 sm:gap-1.5 sm:max-h-[13rem]">
          {Array.from({ length: CENTER_BARS }, (_, i) => (
            <div
              key={i}
              ref={(el) => {
                barRefs.current[i] = el
              }}
              className={`w-[3px] rounded-full sm:w-[4px] ${barClass}`}
              style={{
                height: '18%',
                opacity: 0.45,
                boxShadow: isNight ? '0 0 10px rgba(245,198,214,0.25)' : '0 0 8px rgba(244,114,182,0.2)',
              }}
            />
          ))}
        </div>
      </div>

      <motion.p
        className={`absolute bottom-[14%] left-1/2 -translate-x-1/2 font-jp-hand text-[0.65rem] tracking-[0.5em] sm:bottom-[12%] sm:text-xs ${
          isNight ? 'text-sakura-pink/50' : 'text-rose-500/55'
        }`}
        animate={
          reduced
            ? {}
            : {
                opacity: live ? [0.45, 0.85, 0.5] : [0.35, 0.55, 0.4],
                y: live ? [0, -2, 0] : [0, -1, 0],
              }
        }
        transition={{ duration: live ? 0.9 : 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        音流
      </motion.p>

      {!live && (
        <motion.div
          className={`absolute left-1/2 top-[18%] -translate-x-1/2 text-[0.55rem] font-jp-hand sm:text-[0.6rem] ${
            isNight ? 'text-parchment/35' : 'text-[color:var(--dawn-muted)]'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.25, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          静
        </motion.div>
      )}
    </div>
  )
}
