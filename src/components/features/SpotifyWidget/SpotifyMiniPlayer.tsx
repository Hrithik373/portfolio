import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const PLAYLIST_ID = '4jg2gFqMf3RE8ACFx1IGTx'
const EMBED_URL = `https://open.spotify.com/embed/playlist/${PLAYLIST_ID}?utm_source=generator&theme=0`

function EqualizerBars({ active }: { active: boolean }) {
  const bars = [
    { heights: [3, 14, 6, 18, 4], dur: 0.55 },
    { heights: [14, 5, 18, 3, 12], dur: 0.7 },
    { heights: [6, 18, 3, 14, 8], dur: 0.5 },
    { heights: [18, 4, 12, 6, 16], dur: 0.65 },
  ]
  return (
    <div className="flex items-end gap-[2px]" style={{ height: 18 }}>
      {bars.map((bar, i) =>
        active ? (
          <motion.div
            key={i}
            className="w-[3px] rounded-full bg-[#e8927c]"
            animate={{ height: bar.heights }}
            transition={{ duration: bar.dur, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          />
        ) : (
          <div key={i} className="w-[3px] rounded-full bg-[#8ab5c0]/50" style={{ height: 4 }} />
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

  // Close on outside tap
  useEffect(() => {
    if (!expanded) return
    const handler = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [expanded])

  return (
    <div ref={containerRef} className="fixed left-4 z-[60] flex items-start gap-2" style={{ top: 'max(16px, env(safe-area-inset-top, 16px))' }}>

      {/* Circle FAB */}
      <button
        type="button"
        onClick={() => { setExpanded((v) => !v); setActive(true) }}
        aria-label={expanded ? 'Collapse player' : 'Open music player'}
        className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border backdrop-blur-xl transition-all active:scale-95"
        style={{
          background: isNight
            ? 'radial-gradient(circle at 40% 35%, #0d2a38, #07161f)'
            : 'radial-gradient(circle at 40% 35%, #c8e4ea, #e8f4f7)',
          borderColor: active && expanded
            ? 'rgba(232,146,124,0.55)'
            : isNight ? 'rgba(30,74,92,0.7)' : 'rgba(168,207,216,0.7)',
          boxShadow: active && expanded
            ? '0 0 20px rgba(232,146,124,0.35), 0 0 0 1px rgba(232,146,124,0.15)'
            : '0 4px 20px rgba(0,0,0,0.45)',
        }}
      >
        <span className="font-jp-hand text-lg" style={{ color: '#e8927c' }}>蛤</span>
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2">
          <EqualizerBars active={active && expanded} />
        </div>
        {active && expanded && (
          <span className="absolute inset-0 animate-ping rounded-full border border-[#e8927c]/20" />
        )}
      </button>

      {/* Expanded Spotify embed panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 34 }}
            className="overflow-hidden rounded-2xl"
            style={{
              width: 300,
              boxShadow: isNight
                ? '0 8px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(30,74,92,0.4)'
                : '0 8px 32px rgba(0,0,0,0.15)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-3.5 py-2.5"
              style={{
                background: isNight ? 'rgba(7,22,31,0.97)' : 'rgba(232,244,247,0.97)',
                borderBottom: `1px solid ${isNight ? 'rgba(30,74,92,0.4)' : 'rgba(168,207,216,0.4)'}`,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="font-jp-hand text-sm" style={{ color: '#e8927c' }}>蛤</span>
                <span className="text-[0.52rem] font-semibold uppercase tracking-[0.2em]" style={{ color: isNight ? '#8ab5c0' : '#4a7a8a' }}>
                  はまぐり · Deep Sea Picks
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="rounded-full p-1 transition-opacity hover:opacity-100"
                style={{ color: isNight ? '#8ab5c0' : '#4a7a8a', opacity: 0.5 }}
                aria-label="Close"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Spotify embed */}
            <iframe
              src={EMBED_URL}
              width="300"
              height="352"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              style={{ display: 'block', border: 'none' }}
              title="はまぐり Deep Sea Picks"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
