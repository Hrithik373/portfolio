import { useEffect, useRef, useState } from 'react'
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

export function SpotifyMiniPlayer({ theme = 'night' }: { theme?: 'night' | 'day' }) {
  const [playlist, setPlaylist] = useState<PlaylistData | null>(null)
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(30)
  const [collapsed, setCollapsed] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isNight = theme === 'night'

  useEffect(() => {
    fetch(apiUrl('/api/spotify/playlist'))
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json() as Promise<PlaylistData>
      })
      .then((data) => {
        // Shuffle tracks on load for variety
        const shuffled = [...data.tracks].sort(() => Math.random() - 0.5)
        setPlaylist({ ...data, tracks: shuffled })
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  const track = playlist?.tracks[idx] ?? null

  // Swap audio src whenever track changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !track?.previewUrl) return
    const wasPlaying = playing
    audio.pause()
    audio.src = track.previewUrl
    audio.load()
    setCurrentTime(0)
    if (wasPlaying) audio.play().catch(() => setPlaying(false))
  }, [idx]) // eslint-disable-line react-hooks/exhaustive-deps

  // Wire audio events
  useEffect(() => {
    const audio = new Audio()
    audio.volume = 0.7
    audioRef.current = audio

    const onTime = () => setCurrentTime(audio.currentTime)
    const onDur = () => setDuration(audio.duration || 30)
    const onEnd = () => {
      setPlaying(false)
      setCurrentTime(0)
      setIdx((i) => (playlist ? (i + 1) % playlist.tracks.length : 0))
    }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('durationchange', onDur)
    audio.addEventListener('ended', onEnd)
    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('durationchange', onDur)
      audio.removeEventListener('ended', onEnd)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio || !track?.previewUrl) return
    if (!audio.src) {
      audio.src = track.previewUrl
      audio.load()
    }
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().catch(() => setPlaying(false))
      setPlaying(true)
    }
  }

  const prev = () => {
    if (!playlist) return
    setIdx((i) => (i - 1 + playlist.tracks.length) % playlist.tracks.length)
  }

  const next = () => {
    if (!playlist) return
    setIdx((i) => (i + 1) % playlist.tracks.length)
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // ── Styles ──────────────────────────────────────────────
  const cardBase = isNight
    ? 'border border-[#1e4a5c]/70 bg-[#07161f]/85 text-[#f0e8e0]'
    : 'border border-[#a8cfd8]/60 bg-[#e8f4f7]/90 text-[#1a3a46]'
  const mutedText = isNight ? 'text-[#8ab5c0]/80' : 'text-[#4a7a8a]/80'
  const coral = isNight ? 'text-[#e8927c]' : 'text-[#c0604a]'
  const coralBg = isNight ? 'bg-[#e8927c]' : 'bg-[#c0604a]'
  const btnBase = isNight
    ? 'rounded-full border border-[#1e4a5c]/80 bg-[#0d2a38]/70 text-[#8ab5c0] active:scale-90 transition-transform'
    : 'rounded-full border border-[#a8cfd8]/50 bg-white/70 text-[#4a7a8a] active:scale-90 transition-transform'

  if (status === 'loading') {
    return (
      <div className={`rounded-2xl ${cardBase} backdrop-blur-xl px-4 py-3 shadow-[0_4px_32px_rgba(0,0,0,0.35)]`}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-white/10" />
          <div className="space-y-1.5">
            <div className="h-2.5 w-28 animate-pulse rounded-full bg-white/10" />
            <div className="h-2 w-20 animate-pulse rounded-full bg-white/8" />
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') return null

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${cardBase} backdrop-blur-xl shadow-[0_4px_40px_rgba(0,0,0,0.4)]`}
      style={{ boxShadow: isNight ? '0 0 0 1px rgba(30,74,92,0.5), 0 8px 40px rgba(0,0,0,0.5)' : '0 0 0 1px rgba(168,207,216,0.5), 0 8px 32px rgba(0,0,0,0.1)' }}
    >
      {/* Pearl shimmer top border */}
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(232,192,170,0.6), rgba(138,181,192,0.6), transparent)' }} />

      {/* Shell wave bg texture */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.03]">
        <svg className="absolute -bottom-4 -right-4 h-32 w-32" viewBox="0 0 100 100" fill="none">
          <path d="M10 80 Q30 20 50 50 Q70 80 90 20" stroke="white" strokeWidth="1.5" fill="none" />
          <path d="M5 90 Q25 30 45 60 Q65 90 85 30" stroke="white" strokeWidth="1" fill="none" />
          <path d="M0 100 Q20 40 40 70 Q60 100 80 40" stroke="white" strokeWidth="0.8" fill="none" />
        </svg>
      </div>

      <div className="relative px-4 py-3">
        {/* Header row */}
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`font-jp-hand text-[0.7rem] ${coral}`}>蛤</span>
            <span className={`text-[0.55rem] font-semibold uppercase tracking-[0.22em] ${mutedText}`}>はまぐり · Deep Sea Picks</span>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className={`p-1 ${mutedText} opacity-60 hover:opacity-100 transition-opacity`}
            aria-label={collapsed ? 'Expand player' : 'Collapse player'}
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {collapsed
                ? <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                : <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" />}
            </svg>
          </button>
        </div>

        {/* Main player — hidden when collapsed */}
        {!collapsed && (
          <>
            {/* Track row */}
            <div className="flex items-center gap-3">
              {/* Album art */}
              <div className="relative shrink-0">
                {track?.albumArt ? (
                  <img
                    src={track.albumArt}
                    alt={track.name}
                    className="h-12 w-12 rounded-xl object-cover"
                    style={{ boxShadow: isNight ? '0 0 16px rgba(232,146,124,0.3)' : '0 0 12px rgba(192,96,74,0.2)' }}
                  />
                ) : (
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isNight ? 'bg-[#0d2a38]' : 'bg-[#c8e4ea]/60'}`}>
                    <span className={`font-jp-hand text-xl ${coral}`}>楽</span>
                  </div>
                )}
                {/* Playing pulse ring */}
                {playing && (
                  <span className="absolute -inset-0.5 animate-ping rounded-xl border border-[#e8927c]/30 opacity-75" />
                )}
              </div>

              {/* Track info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.78rem] font-semibold leading-tight" title={track?.name}>
                  {track?.name ?? '—'}
                </p>
                <p className={`truncate text-[0.65rem] leading-tight mt-0.5 ${mutedText}`}>
                  {track?.artist ?? ''}
                </p>
                {/* Time */}
                <p className={`text-[0.55rem] mt-1 tabular-nums ${mutedText} opacity-70`}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                  {!track?.previewUrl && (
                    <span className="ml-1.5 opacity-60">· no preview</span>
                  )}
                </p>
              </div>

              {/* Open in Spotify */}
              {track?.spotifyUrl && (
                <a
                  href={track.spotifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`shrink-0 ${mutedText} opacity-60 hover:opacity-100 transition-opacity`}
                  aria-label="Open in Spotify"
                  title="Open in Spotify"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.622.622 0 01-.277-1.215c3.809-.87 7.077-.496 9.712 1.115a.622.622 0 01.207.857zm1.224-2.722a.78.78 0 01-1.072.257C13.857 12.16 10.71 11.7 7.65 12.58a.781.781 0 01-.45-1.493c3.465-.943 7.013-.487 9.353 1.543a.78.78 0 01.257 1.072zm.105-2.835C14.692 9.15 9.375 8.973 6.332 9.89a.937.937 0 11-.543-1.794c3.493-1.059 9.3-.854 12.972 1.378a.937.937 0 01-.946 1.393z" />
                  </svg>
                </a>
              )}
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div
                className={`h-1 w-full cursor-pointer overflow-hidden rounded-full ${isNight ? 'bg-white/10' : 'bg-black/10'}`}
                onClick={(e) => {
                  const audio = audioRef.current
                  if (!audio || !audio.src) return
                  const rect = e.currentTarget.getBoundingClientRect()
                  const ratio = (e.clientX - rect.left) / rect.width
                  audio.currentTime = ratio * (audio.duration || 30)
                }}
              >
                <div
                  className={`h-full rounded-full transition-all duration-100`}
                  style={{
                    width: `${progress}%`,
                    background: isNight
                      ? 'linear-gradient(90deg, #4a8fa0, #e8927c)'
                      : 'linear-gradient(90deg, #5aaabb, #c0604a)',
                  }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Prev */}
                <button type="button" onClick={prev} className={`${btnBase} p-2`} aria-label="Previous track">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
                  </svg>
                </button>

                {/* Play / Pause */}
                <button
                  type="button"
                  onClick={togglePlay}
                  disabled={!track?.previewUrl}
                  className={`${btnBase} p-2.5 disabled:opacity-30`}
                  style={track?.previewUrl ? { borderColor: isNight ? 'rgba(232,146,124,0.5)' : 'rgba(192,96,74,0.4)' } : {}}
                  aria-label={playing ? 'Pause' : 'Play preview'}
                >
                  {playing ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Next */}
                <button type="button" onClick={next} className={`${btnBase} p-2`} aria-label="Next track">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" />
                  </svg>
                </button>
              </div>

              {/* Track counter + playlist link */}
              <div className="flex items-center gap-2">
                <span className={`text-[0.55rem] tabular-nums ${mutedText} opacity-60`}>
                  {idx + 1} / {playlist?.tracks.length ?? 0}
                </span>
                {playlist?.externalUrl && (
                  <a
                    href={playlist.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`text-[0.58rem] ${coral} opacity-80 hover:opacity-100 transition-opacity`}
                  >
                    Full playlist ↗
                  </a>
                )}
              </div>
            </div>
          </>
        )}

        {/* Collapsed state — just show track name inline */}
        {collapsed && track && (
          <div className="flex items-center gap-2">
            {track.albumArt && (
              <img src={track.albumArt} alt="" className="h-6 w-6 rounded-md object-cover opacity-80" />
            )}
            <p className={`truncate text-[0.68rem] ${mutedText}`}>{track.name} · {track.artist}</p>
            <button type="button" onClick={togglePlay} className={`ml-auto shrink-0 ${mutedText}`} aria-label={playing ? 'Pause' : 'Play'}>
              {playing
                ? <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                : <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
