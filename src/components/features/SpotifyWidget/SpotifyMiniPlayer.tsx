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

// Animated equalizer bars — 4 bars bouncing when playing
function EqualizerBars({ playing }: { playing: boolean }) {
  const bars = [
    { height: [3, 14, 6, 18, 4], duration: 0.55 },
    { height: [14, 5, 18, 3, 12], duration: 0.7 },
    { height: [6, 18, 3, 14, 8], duration: 0.5 },
    { height: [18, 4, 12, 6, 16], duration: 0.65 },
  ]

  return (
    <div className="flex items-end gap-[2px]" style={{ height: 18 }}>
      {bars.map((bar, i) =>
        playing ? (
          <motion.div
            key={i}
            className="w-[3px] rounded-full bg-[#e8927c]"
            animate={{ height: bar.height }}
            transition={{ duration: bar.duration, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
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
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isNight = theme === 'night'

  useEffect(() => {
    fetch(apiUrl('/api/spotify/playlist'))
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json() as Promise<PlaylistData>
      })
      .then((data) => {
        const shuffled = [...data.tracks].sort(() => Math.random() - 0.5)
        setPlaylist({ ...data, tracks: shuffled })
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  const track = playlist?.tracks[idx] ?? null
  const trackCount = playlist?.tracks.length ?? 0

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio || !track?.previewUrl) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    }
  }

  const handleEnded = () => {
    setPlaying(false)
    setCurrentTime(0)
    setIdx((i) => (trackCount > 0 ? (i + 1) % trackCount : 0))
  }

  const prev = () => {
    setPlaying(false)
    setCurrentTime(0)
    setIdx((i) => (trackCount > 0 ? (i - 1 + trackCount) % trackCount : 0))
  }
  const next = () => {
    setPlaying(false)
    setCurrentTime(0)
    setIdx((i) => (trackCount > 0 ? (i + 1) % trackCount : 0))
  }
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const cardBg = isNight ? 'bg-[#07161f]/92 border-[#1e4a5c]/60' : 'bg-[#e8f4f7]/95 border-[#a8cfd8]/60'
  const mutedText = isNight ? 'text-[#8ab5c0]/80' : 'text-[#4a7a8a]/80'
  const trackText = isNight ? 'text-[#f0e8e0]' : 'text-[#1a3a46]'

  // Loading — show ghost circle
  if (status === 'loading') {
    return (
      <div className="fixed left-4 top-4 z-[60]">
        <div className="h-12 w-12 animate-pulse rounded-full border border-white/10 bg-white/5" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="fixed left-4 top-4 z-[60]">
        <div
          className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-[#1e4a5c]/60 bg-[#07161f]/80 backdrop-blur-xl"
          title="Music unavailable"
        >
          <span className="font-jp-hand text-lg text-[#e8927c]/40">蛤</span>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed left-4 top-4 z-[60]">
      <div className="flex items-start gap-2">

        {/* ── Circle trigger ── */}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-label={expanded ? 'Collapse player' : 'Expand player'}
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border backdrop-blur-xl transition-all active:scale-95"
          style={{
            background: isNight
              ? 'radial-gradient(circle at 40% 35%, #0d2a38, #07161f)'
              : 'radial-gradient(circle at 40% 35%, #c8e4ea, #e8f4f7)',
            borderColor: playing
              ? isNight ? 'rgba(232,146,124,0.5)' : 'rgba(192,96,74,0.4)'
              : isNight ? 'rgba(30,74,92,0.7)' : 'rgba(168,207,216,0.7)',
            boxShadow: playing
              ? isNight ? '0 0 18px rgba(232,146,124,0.35), 0 0 0 1px rgba(232,146,124,0.15)' : '0 0 14px rgba(192,96,74,0.25)'
              : '0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          {/* Album art inside circle */}
          {track?.albumArt ? (
            <img
              src={track.albumArt}
              alt=""
              className="h-full w-full rounded-full object-cover opacity-70"
            />
          ) : (
            <span className="font-jp-hand text-lg text-[#e8927c]">蛤</span>
          )}

          {/* Equalizer bars overlay at bottom of circle */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2">
            <EqualizerBars playing={playing} />
          </div>

          {/* Pulse ring when playing */}
          {playing && (
            <span className="absolute inset-0 animate-ping rounded-full border border-[#e8927c]/25" />
          )}
        </button>

        {/* ── Expanded panel ── */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, x: -12, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -12, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className={`w-56 overflow-hidden rounded-2xl border backdrop-blur-2xl ${cardBg}`}
              style={{
                boxShadow: isNight
                  ? '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(30,74,92,0.4)'
                  : '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(168,207,216,0.5)',
              }}
            >
              {/* Pearl shimmer top */}
              <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(232,192,170,0.6), rgba(138,181,192,0.5), transparent)' }} />

              <div className="p-3">
                {/* Header */}
                <div className="mb-2 flex items-center justify-between">
                  <span className={`text-[0.52rem] font-semibold uppercase tracking-[0.2em] ${mutedText}`}>蛤 はまぐり · Now Playing</span>
                  {playlist?.externalUrl && (
                    <a href={playlist.externalUrl} target="_blank" rel="noreferrer" className={`text-[0.52rem] ${mutedText} opacity-60 hover:opacity-100`}>
                      Full ↗
                    </a>
                  )}
                </div>

                {/* Track info */}
                <div className="mb-2.5 flex items-center gap-2">
                  {track?.albumArt ? (
                    <img src={track.albumArt} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" style={{ boxShadow: isNight ? '0 0 12px rgba(232,146,124,0.25)' : undefined }} />
                  ) : (
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isNight ? 'bg-[#0d2a38]' : 'bg-[#c8e4ea]/60'}`}>
                      <span className="font-jp-hand text-base text-[#e8927c]">楽</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className={`truncate text-[0.72rem] font-semibold leading-tight ${trackText}`}>{track?.name ?? '—'}</p>
                    <p className={`truncate text-[0.6rem] mt-0.5 ${mutedText}`}>{track?.artist ?? ''}</p>
                    <p className={`text-[0.52rem] mt-0.5 tabular-nums ${mutedText} opacity-60`}>{formatTime(currentTime)} / {formatTime(duration)}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div
                  className={`mb-3 h-1 w-full cursor-pointer overflow-hidden rounded-full ${isNight ? 'bg-white/10' : 'bg-black/10'}`}
                  onClick={(e) => {
                    const audio = audioRef.current
                    if (!audio || !audio.src) return
                    const rect = e.currentTarget.getBoundingClientRect()
                    audio.currentTime = ((e.clientX - rect.left) / rect.width) * (audio.duration || 30)
                  }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-100"
                    style={{
                      width: `${progress}%`,
                      background: isNight ? 'linear-gradient(90deg, #4a8fa0, #e8927c)' : 'linear-gradient(90deg, #5aaabb, #c0604a)',
                    }}
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={prev} className={`rounded-full p-1.5 transition-colors ${isNight ? 'text-[#8ab5c0] hover:bg-white/10' : 'text-[#4a7a8a] hover:bg-black/10'}`} aria-label="Previous">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" /></svg>
                    </button>
                    <button
                      type="button"
                      onClick={togglePlay}
                      disabled={!track?.previewUrl}
                      aria-label={playing ? 'Pause' : 'Play'}
                      className="rounded-full p-2 transition-all disabled:opacity-30"
                      style={{
                        background: isNight ? 'rgba(232,146,124,0.15)' : 'rgba(192,96,74,0.12)',
                        border: `1px solid ${isNight ? 'rgba(232,146,124,0.4)' : 'rgba(192,96,74,0.35)'}`,
                        color: isNight ? '#e8927c' : '#c0604a',
                      }}
                    >
                      {playing
                        ? <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                        : <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
                    </button>
                    <button type="button" onClick={next} className={`rounded-full p-1.5 transition-colors ${isNight ? 'text-[#8ab5c0] hover:bg-white/10' : 'text-[#4a7a8a] hover:bg-black/10'}`} aria-label="Next">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" /></svg>
                    </button>
                  </div>
                  <span className={`text-[0.52rem] tabular-nums ${mutedText} opacity-50`}>{idx + 1}/{playlist?.tracks.length ?? 0}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden audio element — rendered in DOM for reliable mobile playback */}
      {track?.previewUrl && (
        <audio
          ref={audioRef}
          src={track.previewUrl}
          volume={0.7}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onDurationChange={(e) => setDuration(e.currentTarget.duration || 30)}
          onEnded={handleEnded}
          onPause={() => setPlaying(false)}
        />
      )}
    </div>
  )
}
