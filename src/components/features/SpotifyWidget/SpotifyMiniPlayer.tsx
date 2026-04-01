import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
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
    { heights: [3, 12, 5, 16, 4], dur: 0.55 },
    { heights: [12, 4, 16, 3, 10], dur: 0.7 },
    { heights: [5, 16, 3, 12, 7], dur: 0.5 },
    { heights: [16, 3, 10, 5, 14], dur: 0.65 },
  ]
  return (
    <div className="flex items-end gap-[2px]" style={{ height: 16 }}>
      {bars.map((bar, i) =>
        playing ? (
          <motion.div
            key={i}
            className="w-[2.5px] rounded-full bg-[#e8927c]"
            animate={{ height: bar.heights }}
            transition={{ duration: bar.dur, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          />
        ) : (
          <div key={i} className="w-[2.5px] rounded-full bg-[#8ab5c0]/40" style={{ height: 3 }} />
        )
      )}
    </div>
  )
}

const COLLAPSED_H = 56
const EXPANDED_H = 220

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

  // Motion values for drag
  const dragY = useMotionValue(0)
  const height = useTransform(dragY, [0, EXPANDED_H - COLLAPSED_H], [COLLAPSED_H, EXPANDED_H])
  const expandProgress = useTransform(dragY, [0, EXPANDED_H - COLLAPSED_H], [0, 1])

  const snapTo = (open: boolean) => {
    const target = open ? EXPANDED_H - COLLAPSED_H : 0
    void animate(dragY, target, { type: 'spring', stiffness: 400, damping: 36 })
    setExpanded(open)
  }

  const handleDragEnd = (_: unknown, info: { velocity: { y: number }; offset: { y: number } }) => {
    const { velocity, offset } = info
    if (velocity.y > 200 || offset.y > 60) snapTo(true)
    else if (velocity.y < -200 || offset.y < -60) snapTo(false)
    else snapTo(expanded)
  }

  // Fetch playlist
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

  // Media Session API — lock screen controls
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

  // Update lock screen metadata
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

  // Load track on idx change
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
  const border = night ? 'rgba(30,74,92,0.55)' : 'rgba(168,207,216,0.55)'
  const bg = night ? 'rgba(7,22,31,0.94)' : 'rgba(232,244,247,0.96)'
  const muted = night ? '#8ab5c0' : '#4a7a8a'
  const text = night ? '#f0e8e0' : '#1a3a46'
  const coral = '#e8927c'

  if (status === 'loading') {
    return (
      <div className="fixed left-0 right-0 top-0 z-[60] px-3 pt-2">
        <div className="mx-auto h-14 max-w-sm animate-pulse rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl" />
      </div>
    )
  }

  if (status === 'error') return null

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration || 30)}
        onEnded={() => { setPlaying(false); setCurrentTime(0); setIdx((i) => trackCount > 0 ? (i + 1) % trackCount : 0) }}
      />

      <motion.div
        className="fixed left-0 right-0 top-0 z-[60] overflow-hidden px-3 pt-2"
        style={{ height }}
      >
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: EXPANDED_H - COLLAPSED_H }}
          dragElastic={0.08}
          onDragEnd={handleDragEnd}
          className="h-full w-full cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
        >
          <div
            className="flex h-full w-full max-w-sm mx-auto flex-col overflow-hidden rounded-2xl backdrop-blur-2xl"
            style={{ background: bg, border: `1px solid ${border}`, boxShadow: night ? '0 8px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(30,74,92,0.3)' : '0 4px 24px rgba(0,0,0,0.1)' }}
          >
            {/* Pearl top accent */}
            <div className="h-px w-full shrink-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(232,192,170,0.7), rgba(138,181,192,0.5), transparent)' }} />

            {/* Drag handle */}
            <div className="flex justify-center pt-1.5 shrink-0">
              <div className="h-1 w-8 rounded-full" style={{ background: night ? 'rgba(138,181,192,0.25)' : 'rgba(74,122,138,0.2)' }} />
            </div>

            {/* ── Collapsed bar ── */}
            <div className="flex shrink-0 items-center gap-3 px-3 py-2">
              {/* Album art */}
              <div className="relative shrink-0">
                {track?.albumArt
                  ? <img src={track.albumArt} alt="" className="h-8 w-8 rounded-lg object-cover" style={{ boxShadow: playing ? `0 0 10px rgba(232,146,124,0.4)` : undefined }} />
                  : <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: night ? '#0d2a38' : '#c8e4ea' }}><span className="font-jp-hand text-sm" style={{ color: coral }}>蛤</span></div>
                }
                {playing && <span className="absolute inset-0 animate-ping rounded-lg border border-[#e8927c]/30" />}
              </div>

              {/* Track name + equalizer */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[0.72rem] font-semibold leading-tight" style={{ color: text }}>{track?.name ?? '—'}</p>
                  <EqualizerBars playing={playing} />
                </div>
                <p className="truncate text-[0.58rem]" style={{ color: muted }}>{track?.artist ?? ''}</p>
              </div>

              {/* Play / pause */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); togglePlay() }}
                disabled={!track?.previewUrl}
                aria-label={playing ? 'Pause' : 'Play'}
                className="shrink-0 rounded-full p-2 transition-all disabled:opacity-30 active:scale-90"
                style={{ background: night ? 'rgba(232,146,124,0.15)' : 'rgba(192,96,74,0.1)', border: `1px solid ${night ? 'rgba(232,146,124,0.4)' : 'rgba(192,96,74,0.3)'}`, color: coral }}
              >
                {playing
                  ? <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                  : <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
              </button>
            </div>

            {/* ── Expanded content (fades in as you drag) ── */}
            <motion.div className="flex flex-col gap-2 px-3 pb-3 shrink-0" style={{ opacity: expandProgress }}>
              {/* Progress bar */}
              <div
                className="h-1 w-full cursor-pointer overflow-hidden rounded-full"
                style={{ background: night ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
                onClick={(e) => {
                  const audio = audioRef.current
                  if (!audio?.src) return
                  const rect = e.currentTarget.getBoundingClientRect()
                  audio.currentTime = ((e.clientX - rect.left) / rect.width) * (audio.duration || 30)
                }}
              >
                <div className="h-full rounded-full transition-all duration-100" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${night ? '#4a8fa0' : '#5aaabb'}, ${coral})` }} />
              </div>

              {/* Time */}
              <div className="flex justify-between">
                <span className="text-[0.5rem] tabular-nums" style={{ color: muted }}>{formatTime(currentTime)}</span>
                <span className="text-[0.5rem] tabular-nums" style={{ color: muted }}>{formatTime(duration)}</span>
              </div>

              {/* Controls row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={prev} className="rounded-full p-1.5 active:scale-90 transition-transform" style={{ color: muted }} aria-label="Previous">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" /></svg>
                  </button>
                  <button
                    type="button" onClick={togglePlay} disabled={!track?.previewUrl}
                    className="rounded-full p-2.5 transition-all disabled:opacity-30 active:scale-90"
                    style={{ background: night ? 'rgba(232,146,124,0.18)' : 'rgba(192,96,74,0.12)', border: `1px solid ${night ? 'rgba(232,146,124,0.45)' : 'rgba(192,96,74,0.35)'}`, color: coral }}
                    aria-label={playing ? 'Pause' : 'Play'}
                  >
                    {playing
                      ? <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                      : <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
                  </button>
                  <button type="button" onClick={next} className="rounded-full p-1.5 active:scale-90 transition-transform" style={{ color: muted }} aria-label="Next">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" /></svg>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[0.5rem] tabular-nums" style={{ color: muted }}>{idx + 1}/{trackCount}</span>
                  {playlist?.externalUrl && (
                    <a href={playlist.externalUrl} target="_blank" rel="noreferrer" className="text-[0.55rem] font-medium" style={{ color: coral }}>Deezer ↗</a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </>
  )
}
