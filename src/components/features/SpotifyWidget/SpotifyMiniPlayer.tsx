import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

const EMBED_URL =
  'https://open.spotify.com/embed/playlist/4jg2gFqMf3RE8ACFx1IGTx?utm_source=generator&theme=0'

function EqualizerBars({ active }: { active: boolean }) {
  const bars = [
    { h: [2, 10, 4, 14, 3], d: 0.55 },
    { h: [10, 3, 14, 2, 9], d: 0.7 },
    { h: [4, 14, 2, 10, 6], d: 0.5 },
    { h: [14, 3, 9, 4, 12], d: 0.65 },
  ]
  return (
    <div className="flex items-end gap-[2px]" style={{ height: 14 }}>
      {bars.map((bar, i) =>
        active ? (
          <motion.div
            key={i}
            className="w-[2px] rounded-full"
            style={{ background: '#e8927c' }}
            animate={{ height: bar.h }}
            transition={{ duration: bar.d, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          />
        ) : (
          <div key={i} className="w-[2px] rounded-full" style={{ height: 3, background: 'rgba(138,181,192,0.45)' }} />
        )
      )}
    </div>
  )
}

export function SpotifyMiniPlayer({ theme = 'night' }: { theme?: 'night' | 'day' }) {
  const [expanded, setExpanded] = useState(false)
  const [active, setActive] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isNight = theme === 'night'

  // Close on outside tap — music keeps playing
  useEffect(() => {
    if (!expanded) return
    const handler = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false) // hide panel, NOT unmount iframe
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [expanded])

  const night = isNight
  const fabBg = night
    ? 'radial-gradient(circle at 35% 30%, #0d2a38, #07161f)'
    : 'radial-gradient(circle at 35% 30%, #c8e4ea, #e8f4f7)'
  const fabBorder = active
    ? 'rgba(232,146,124,0.6)'
    : night ? 'rgba(30,74,92,0.65)' : 'rgba(168,207,216,0.65)'
  const fabShadow = active
    ? '0 0 18px rgba(232,146,124,0.35), 0 0 0 1px rgba(232,146,124,0.15)'
    : '0 4px 16px rgba(0,0,0,0.5)'

  return (
    <div
      ref={containerRef}
      className="fixed left-3 z-[60]"
      style={{ top: 'max(14px, env(safe-area-inset-top, 14px))' }}
    >
      {/* ── FAB circle ── */}
      <button
        type="button"
        onClick={() => { setExpanded((v) => !v); setActive(true) }}
        aria-label={expanded ? 'Collapse player' : 'Open music player'}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-xl transition-transform active:scale-90"
        style={{ background: fabBg, borderColor: fabBorder, boxShadow: fabShadow }}
      >
        <span className="font-jp-hand text-base leading-none" style={{ color: '#e8927c' }}>蛤</span>
        {/* Equalizer bars at bottom of circle */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
          <EqualizerBars active={active} />
        </div>
        {active && (
          <span className="absolute inset-0 animate-ping rounded-full border border-[#e8927c]/20 pointer-events-none" />
        )}
      </button>

      {/* ── Spotify embed panel — always in DOM, only hidden visually ── */}
      <div
        className="absolute left-0 overflow-hidden rounded-2xl transition-all duration-300"
        style={{
          top: 'calc(100% + 8px)',
          width: expanded ? 288 : 0,
          height: expanded ? 'auto' : 0,
          opacity: expanded ? 1 : 0,
          pointerEvents: expanded ? 'auto' : 'none',
          boxShadow: expanded
            ? night
              ? '0 8px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(30,74,92,0.4)'
              : '0 8px 32px rgba(0,0,0,0.15)'
            : 'none',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{
            background: night ? 'rgba(7,22,31,0.98)' : 'rgba(232,244,247,0.98)',
            borderBottom: `1px solid ${night ? 'rgba(30,74,92,0.4)' : 'rgba(168,207,216,0.4)'}`,
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="font-jp-hand text-sm" style={{ color: '#e8927c' }}>蛤</span>
            <span
              className="text-[0.5rem] font-semibold uppercase tracking-[0.18em]"
              style={{ color: night ? '#8ab5c0' : '#4a7a8a' }}
            >
              はまぐり · Deep Sea Picks
            </span>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label="Minimize player"
            className="rounded-full p-1 transition-opacity hover:opacity-100"
            style={{ color: night ? '#8ab5c0' : '#4a7a8a', opacity: 0.5 }}
          >
            <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Spotify iframe — always rendered so music doesn't stop on collapse */}
        <iframe
          src={EMBED_URL}
          width="288"
          height="320"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          style={{ display: 'block', border: 'none' }}
          title="はまぐり Deep Sea Picks"
        />
      </div>
    </div>
  )
}
