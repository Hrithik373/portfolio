import { useState, useRef, useEffect } from 'react'

const VIDEO_ID = 'mVycGYAPehY'
const EMBED_URL = `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=0&controls=1&rel=0&modestbranding=1&color=white&enablejsapi=1&origin=${encodeURIComponent('https://hrithikghosh.vercel.app')}`

// Send command to YouTube iframe via postMessage
function ytCmd(iframe: HTMLIFrameElement | null, func: string) {
  iframe?.contentWindow?.postMessage(
    JSON.stringify({ event: 'command', func, args: '' }),
    '*'
  )
}

export function SpotifyMiniPlayer({ theme = 'night' }: { theme?: 'night' | 'day' }) {
  const [expanded, setExpanded] = useState(false)
  const [playing, setPlaying] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const night = theme === 'night'

  // Listen to YouTube player state changes via postMessage
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        // YouTube sends playerState: 1=playing, 2=paused, 0=ended
        if (data?.event === 'infoDelivery' && data?.info?.playerState !== undefined) {
          setPlaying(data.info.playerState === 1)
        }
        if (data?.event === 'onStateChange') {
          setPlaying(data.info === 1)
        }
      } catch {}
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // Media Session API — Android lock screen controls
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Deep Sea Picks',
      artist: 'はまぐり',
      album: 'Portfolio · Music',
    })
    navigator.mediaSession.setActionHandler('play', () => {
      ytCmd(iframeRef.current, 'playVideo')
      setPlaying(true)
    })
    navigator.mediaSession.setActionHandler('pause', () => {
      ytCmd(iframeRef.current, 'pauseVideo')
      setPlaying(false)
    })
    return () => {
      navigator.mediaSession.setActionHandler('play', null)
      navigator.mediaSession.setActionHandler('pause', null)
    }
  }, [])

  // Sync Media Session playback state
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
  }, [playing])

  // Close panel on outside tap
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
          borderColor: playing
            ? 'rgba(232,146,124,0.5)'
            : night ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          boxShadow: playing
            ? '0 2px 16px rgba(232,146,124,0.25)'
            : night ? '0 2px 16px rgba(0,0,0,0.5)' : '0 2px 12px rgba(0,0,0,0.1)',
        }}
      >
        <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="currentColor"
          style={{ color: playing ? '#e8927c' : night ? 'rgba(138,181,192,0.7)' : 'rgba(74,122,138,0.7)' }}>
          <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
        </svg>
        <span className="text-[0.6rem] font-medium tracking-wide"
          style={{ color: night ? 'rgba(240,232,224,0.8)' : 'rgba(26,58,70,0.8)' }}>
          {expanded ? 'minimise' : 'music'}
        </span>
        <svg
          className="h-2.5 w-2.5 shrink-0 transition-transform duration-200"
          style={{
            color: night ? 'rgba(138,181,192,0.5)' : 'rgba(74,122,138,0.5)',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Player panel — always in DOM, hidden via CSS */}
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
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{ borderBottom: `1px solid ${night ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}
        >
          <span className="text-[0.55rem] uppercase tracking-[0.2em] font-medium"
            style={{ color: night ? 'rgba(138,181,192,0.7)' : 'rgba(74,122,138,0.7)' }}>
            now playing
          </span>
          <button type="button" onClick={() => setExpanded(false)} aria-label="Minimise"
            style={{ color: night ? 'rgba(138,181,192,0.5)' : 'rgba(74,122,138,0.5)' }}>
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* YouTube iframe */}
        <iframe
          ref={iframeRef}
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
