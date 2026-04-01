import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { apiUrl } from '../../../config/apiBase'

interface Track {
  id: string
  name: string
  artist: string
  albumArt: string | null
  previewUrl: string | null
  spotifyUrl: string
  durationMs: number
}

interface PlaylistData {
  name: string
  description: string
  image: string | null
  externalUrl: string
  tracks: Track[]
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function EqualizerBars({ playing }: { playing: boolean }) {
  const bars = [
    { heights: [3, 14, 6, 18, 4], dur: 0.55 },
    { heights: [14, 5, 18, 3, 12], dur: 0.7 },
    { heights: [6, 18, 3, 14, 8], dur: 0.5 },
    { heights: [18, 4, 12, 6, 16], dur: 0.65 },
  ]
  return (
    <div className="flex items-end gap-[2px]" style={{ height: 18 }}>
      {bars.map((bar, i) =>
        playing ? (
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
  const [playlist, setPlaylist] = useState<PlaylistData | null>(null)
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(30)
  const [expanded, setExpanded] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const trackCountRef = useRef(0)
  const isNight = theme === 'night'

  // Fetch playlist once
  useEffect(() => {
    fetch(apiUrl('/api/spotify/playlist'))
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json() as Promise<PlaylistData> })
      .then((data) => {
        setPlaylist({ ...data, tracks: [...data.tracks].sort(() => Math.random() - 0.5) })
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  const track = playlist?.tracks[idx] ?? null
  const trackCount = playlist?.tracks.length ?? 0
  trackCountRef.current = trackCount

  // Media Session API — keeps audio alive on lock screen
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    const ms = navigator.mediaSession
    ms.setActionHandler('play', () => { audioRef.current?.play().then(() => setPlaying(true)).catch(() => {}) })
    ms.setActionHandler('pause', () => { audioRef.current?.pause(); setPlaying(false) })
    ms.setActionHandler('previoustrack', () => { const n = trackCountRef.current; setIdx((i) => n > 0 ? (i - 1 + n) % n : 0) })
    ms.setActionHandler('nexttrack', () => { const n = trackCountRef.current; setIdx((i) => n > 0 ? (i + 1) % n : 0) })
    return () => {
      ms.setActionHandler('play', null); ms.setActionHandler('pause', null)
      ms.setActionHandler('previoustrack', null); ms.setActionHandler('nexttrack', null)
    }
  }, [])

  useEffect(() => {
    if (!('mediaSession' in navigator) || !track) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.name, artist: track.artist, album: 'はまぐり · Deep Sea Picks',
      artwork: track.albumArt ? [{ src: track.albumArt, sizes: '500x500', type: 'image/jpeg' }] : [],
    })
  }, [track])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
  }, [playing])

  // Load new src whenever track changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause(); setPlaying(false); setCurrentTime(0)
    if (track?.previewUrl) { audio.src = track.previewUrl; audio.volume = 0.7; audio.load() }
    else audio.src = ''
  }, [idx, track?.previewUrl])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio || !track?.previewUrl) return
    if (playing) { audio.pause(); setPlaying(false) }
    else audio.play().then(() => setPlaying(true)).catch((e) => { console.warn('[Player]', e); setPlaying(false) })
  }

  const prev = () => { if (trackCount > 0) setIdx((i) => (i - 1 + trackCount) % trackCount) }
  const next = () => { if (trackCount > 0) setIdx((i) => (i + 1) % trackCount) }
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const night = isNight
  const mutedColor = night ? '#8ab5c0' : '#4a7a8a'
  const textColor = night ? '#f0e8e0' : '#1a3a46'
  const coral = '#e8927c'

  if (status === 'loading') {
    return (
      <div className="fixed left-4 top-4 z-[60]">
        <div className="h-12 w-12 animate-pulse rounded-full border border-white/10 bg-white/5" />
      </div>
    )
  }

  if (status === 'error') return null

  return (
    <>
      {/* Always-present audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration || 30)}
        onEnded={() => { setPlaying(false); setCurrentTime(0); setIdx((i) => trackCount > 0 ? (i + 1) % trackCount : 0) }}
      />

      <div className="fixed left-4 top-4 z-[60] flex items-start gap-2">

        {/* ── Circle FAB ── */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? 'Collapse player' : 'Expand player'}
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border backdrop-blur-xl transition-all active:scale-95"
          style={{
            background: night ? 'radial-gradient(circle at 40% 35%, #0d2a38, #07161f)' : 'radial-gradient(circle at 40% 35%, #c8e4ea, #e8f4f7)',
            borderColor: playing ? 'rgba(232,146,124,0.55)' : (night ? 'rgba(30,74,92,0.7)' : 'rgba(168,207,216,0.7)'),
            boxShadow: playing
              ? '0 0 20px rgba(232,146,124,0.4), 0 0 0 1px rgba(232,146,124,0.2)'
              : '0 4px 20px rgba(0,0,0,0.45)',
          }}
        >
          {track?.albumArt
            ? <img src={track.albumArt} alt="" className="h-full w-full rounded-full object-cover opacity-75" />
            : <span className="font-jp-hand text-lg" style={{ color: coral }}>蛤</span>}

          {/* Equalizer bars */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2">
            <EqualizerBars playing={playing} />
          </div>

          {playing && <span className="absolute inset-0 animate-ping rounded-full border border-[#e8927c]/25" />}
        </button>

        {/* ── Expanded panel ── */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, x: -10, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -10, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              className="w-60 overflow-hidden rounded-2xl backdrop-blur-2xl"
              style={{
                background: night ? 'rgba(7,22,31,0.93)' : 'rgba(232,244,247,0.96)',
                border: `1px solid ${night ? 'rgba(30,74,92,0.55)' : 'rgba(168,207,216,0.6)'}`,
                boxShadow: night ? '0 8px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(30,74,92,0.35)' : '0 8px 32px rgba(0,0,0,0.1)',
              }}
            >
              {/* Pearl shimmer line */}
              <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(232,192,170,0.65), rgba(138,181,192,0.5), transparent)' }} />

              <div className="p-3.5">
                {/* Header */}
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[0.52rem] font-semibold uppercase tracking-[0.22em]" style={{ color: mutedColor }}>蛤 はまぐり · Now Playing</span>
                  {playlist?.externalUrl && (
                    <a href={playlist.externalUrl} target="_blank" rel="noreferrer" className="text-[0.52rem] font-medium transition-opacity hover:opacity-100" style={{ color: coral, opacity: 0.75 }}>
                      Deezer ↗
                    </a>
                  )}
                </div>

                {/* Track row */}
                <div className="mb-3 flex items-center gap-2.5">
                  {track?.albumArt
                    ? <img src={track.albumArt} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" style={{ boxShadow: playing ? '0 0 14px rgba(232,146,124,0.3)' : undefined }} />
                    : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: night ? '#0d2a38' : '#c8e4ea' }}><span className="font-jp-hand text-base" style={{ color: coral }}>楽</span></div>
                  }
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.75rem] font-semibold leading-tight" style={{ color: textColor }}>{track?.name ?? '—'}</p>
                    <p className="truncate text-[0.62rem] mt-0.5" style={{ color: mutedColor }}>{track?.artist ?? ''}</p>
                  </div>
                </div>

                {/* Progress bar + time */}
                <div className="mb-1">
                  <div
                    className="h-1 w-full cursor-pointer overflow-hidden rounded-full"
                    style={{ background: night ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)' }}
                    onClick={(e) => {
                      const audio = audioRef.current
                      if (!audio?.src) return
                      const rect = e.currentTarget.getBoundingClientRect()
                      audio.currentTime = ((e.clientX - rect.left) / rect.width) * (audio.duration || 30)
                    }}
                  >
                    <div className="h-full rounded-full transition-all duration-100"
                      style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${night ? '#4a8fa0' : '#5aaabb'}, ${coral})` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-[0.5rem] tabular-nums" style={{ color: mutedColor, opacity: 0.65 }}>{formatTime(currentTime)}</span>
                    <span className="text-[0.5rem] tabular-nums" style={{ color: mutedColor, opacity: 0.65 }}>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="mt-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={prev} aria-label="Previous"
                      className="rounded-full p-2 transition-all active:scale-90"
                      style={{ color: mutedColor, background: night ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" /></svg>
                    </button>

                    <button type="button" onClick={togglePlay} disabled={!track?.previewUrl}
                      aria-label={playing ? 'Pause' : 'Play'}
                      className="rounded-full p-2.5 transition-all active:scale-90 disabled:opacity-30"
                      style={{ background: night ? 'rgba(232,146,124,0.16)' : 'rgba(192,96,74,0.12)', border: `1px solid ${night ? 'rgba(232,146,124,0.45)' : 'rgba(192,96,74,0.35)'}`, color: coral }}>
                      {playing
                        ? <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                        : <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
                    </button>

                    <button type="button" onClick={next} aria-label="Next"
                      className="rounded-full p-2 transition-all active:scale-90"
                      style={{ color: mutedColor, background: night ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" /></svg>
                    </button>
                  </div>

                  <span className="text-[0.52rem] tabular-nums" style={{ color: mutedColor, opacity: 0.5 }}>{idx + 1} / {trackCount}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
