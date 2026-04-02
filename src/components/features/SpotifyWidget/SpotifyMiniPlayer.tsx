import { useState, useRef, useEffect } from 'react'

const VIDEO_ID = 'mVycGYAPehY'
const EMBED_URL = `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=0&controls=1&rel=0&modestbranding=1&color=white`

export function SpotifyMiniPlayer({ theme = 'night' }: { theme?: 'night' | 'day' }) {
  const [expanded, setExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const night = theme === 'night'

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
    <div
      ref={containerRef}
      className="fixed left-3 z-[60]"
      style={{ top: 'max(14px, env(safe-area-inset-top, 14px))' }}
    >
      {/* Pill trigger */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? 'Minimize player' : 'Open music player'}
        className="flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-xl transition-all active:scale-95"
        style={{
          background: night ? 'rgba(7,22,31,0.88)' : 'rgba(232,244,247,0.92)',
          borderColor: night ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          boxShadow: night ? '0 2px 16px rgba(0,0,0,0.5)' : '0 2px 12px rgba(0,0,0,0.1)',
        }}
      >
        {/* Music icon */}
        <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="currentColor"
          style={{ color: '#e8927c' }}>
          <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
        </svg>
        <span
          className="text-[0.6rem] font-medium tracking-wide"
          style={{ color: night ? 'rgba(240,232,224,0.8)' : 'rgba(26,58,70,0.8)' }}
        >
          {expanded ? 'minimise' : 'music'}
        </span>
        {/* Chevron */}
        <svg
          className="h-2.5 w-2.5 shrink-0 transition-transform duration-200"
          style={{
            color: night ? 'rgba(138,181,192,0.6)' : 'rgba(74,122,138,0.6)',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Player panel — always in DOM, hidden via CSS so audio persists */}
      <div
        className="absolute left-0 overflow-hidden rounded-2xl transition-all duration-300 ease-out"
        style={{
          top: 'calc(100% + 6px)',
          width: expanded ? 280 : 0,
          height: expanded ? 'auto' : 0,
          opacity: expanded ? 1 : 0,
          pointerEvents: expanded ? 'auto' : 'none',
          border: expanded ? `1px solid ${night ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` : 'none',
          boxShadow: expanded ? (night ? '0 12px 48px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.12)') : 'none',
          background: night ? 'rgba(7,22,31,0.98)' : 'rgba(232,244,247,0.98)',
        }}
      >
        {/* Minimal header */}
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{ borderBottom: `1px solid ${night ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}
        >
          <span
            className="text-[0.55rem] uppercase tracking-[0.2em] font-medium"
            style={{ color: night ? 'rgba(138,181,192,0.7)' : 'rgba(74,122,138,0.7)' }}
          >
            now playing
          </span>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label="Minimise"
            style={{ color: night ? 'rgba(138,181,192,0.5)' : 'rgba(74,122,138,0.5)' }}
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* YouTube iframe — never unmounted */}
        <iframe
          src={EMBED_URL}
          width="280"
          height="157"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
          style={{ display: 'block', border: 'none' }}
          title="Music player"
        />
      </div>
    </div>
  )
}
