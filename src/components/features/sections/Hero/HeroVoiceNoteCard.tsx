import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { apiUrl, friendlyApiErrorMessage } from '../../../../config/apiBase'
import type { SectionProps } from '../SectionTypes'
import { dayGlassHeroVoice, nightGlassHeroVoice } from '../sectionGlass'

import { FloatingCardPetals } from '../../petals/FloatingCardPetals'
import { VoiceTranscriptPreview, type TranscriptSegment } from './VoiceTranscriptPreview'

type Status = { type: 'success' | 'error' | 'info'; message: string } | null

const cardEnter = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const contentStagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.12 },
  },
}

const contentItem = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const WAVE_BAR_COUNT = 30

/** Same thresholds as useSilenceAutoStop — runs here to avoid a second AudioContext on the mic. */
const SILENCE_RMS_LOUD = 0.032
const SILENCE_RMS_QUIET = 0.016
const SILENCE_HOLD_MS = 1400
const SILENCE_MIN_RECORD_MS = 1100
const SILENCE_MAX_MS = 120_000

/**
 * Real mic- or playback-driven “seigaiha” bars — AnalyserNode FFT; soft lateral flow when not reduced motion.
 * Playback uses captureStream() from the <audio> element (same graph as mic, no speaker routing here).
 */
function JapaneseVoiceWave({
  stream,
  active,
  isNight,
  reduced,
  silenceAutoStop,
  onSilenceStop,
  caption = '音の波',
}: {
  stream: MediaStream | null
  active: boolean
  isNight: boolean
  reduced: boolean
  /** When true, optional silence / max-length logic calls onSilenceStop (recording only). */
  silenceAutoStop?: boolean
  onSilenceStop?: () => void
  /** Short label above the bars (e.g. hearback vs live mic). */
  caption?: string
}) {
  const barsRef = useRef<(HTMLDivElement | null)[]>([])
  const rafRef = useRef(0)
  const ctxRef = useRef<AudioContext | null>(null)
  const onSilenceStopRef = useRef(onSilenceStop)
  useEffect(() => {
    onSilenceStopRef.current = onSilenceStop
  }, [onSilenceStop])

  useEffect(() => {
    if (!stream || !active) {
      barsRef.current.forEach((el) => {
        if (el) {
          el.style.height = '14%'
          el.style.transform = 'translateX(0)'
        }
      })
      return
    }

    let cancelled = false
    const ctx = new AudioContext()
    ctxRef.current = ctx
    void ctx.resume().catch(() => {})

    const source = ctx.createMediaStreamSource(stream)
    const freqAnalyser = ctx.createAnalyser()
    freqAnalyser.fftSize = 512
    freqAnalyser.smoothingTimeConstant = 0.72
    source.connect(freqAnalyser)

    let timeAnalyser: AnalyserNode | null = null
    if (silenceAutoStop) {
      timeAnalyser = ctx.createAnalyser()
      timeAnalyser.fftSize = 512
      timeAnalyser.smoothingTimeConstant = 0.45
      source.connect(timeAnalyser)
    }

    const buf = new Uint8Array(freqAnalyser.frequencyBinCount)
    const timeBuf = timeAnalyser ? new Uint8Array(timeAnalyser.fftSize) : null
    const n = WAVE_BAR_COUNT
    const recordStart = performance.now()
    let speechDetected = false
    let silenceStart: number | null = null
    let silenceFired = false
    const silenceOn = Boolean(silenceAutoStop && onSilenceStop)

    const tick = () => {
      if (cancelled) return
      const now = performance.now()

      if (silenceOn && onSilenceStopRef.current && timeAnalyser && timeBuf) {
        if (now - recordStart > SILENCE_MAX_MS) {
          if (!silenceFired) {
            silenceFired = true
            onSilenceStopRef.current()
          }
          return
        }

        timeAnalyser.getByteTimeDomainData(timeBuf as Uint8Array<ArrayBuffer>)
        let sum = 0
        for (let i = 0; i < timeBuf.length; i++) {
          const x = (timeBuf[i]! - 128) / 128
          sum += x * x
        }
        const rms = Math.sqrt(sum / timeBuf.length)

        if (rms > SILENCE_RMS_LOUD) {
          speechDetected = true
          silenceStart = null
        } else if (rms < SILENCE_RMS_QUIET && speechDetected) {
          if (silenceStart === null) silenceStart = now
          else if (
            now - silenceStart >= SILENCE_HOLD_MS &&
            now - recordStart >= SILENCE_MIN_RECORD_MS &&
            !silenceFired
          ) {
            silenceFired = true
            onSilenceStopRef.current()
            return
          }
        }
      }

      freqAnalyser.getByteFrequencyData(buf)
      const t = now / 1000
      const els = barsRef.current
      for (let i = 0; i < n; i++) {
        const el = els[i]
        if (!el) continue
        const start = Math.floor((i / n) * buf.length * 0.82)
        const end = Math.floor(((i + 1) / n) * buf.length * 0.82)
        let peak = 0
        for (let j = start; j < end; j++) peak = Math.max(peak, buf[j] ?? 0)
        const norm = peak / 255
        const eased = Math.pow(norm, 0.65)
        const h = 10 + eased * 90
        el.style.height = `${Math.min(100, h)}%`
        if (!reduced) {
          const flow = Math.sin(t * 2.4 + i * 0.35) * 1.8 + Math.sin(t * 1.1 + i * 0.12) * 0.9
          el.style.transform = `translateX(${flow}px)`
        } else {
          el.style.transform = 'translateX(0)'
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelled = true
      cancelAnimationFrame(rafRef.current)
      source.disconnect()
      freqAnalyser.disconnect()
      timeAnalyser?.disconnect()
      void ctx.close().catch(() => {})
      ctxRef.current = null
    }
  }, [stream, active, reduced, silenceAutoStop])

  const barClass = isNight
    ? 'bg-gradient-to-t from-sakura-pink/95 via-sakura-pink/50 to-pink-200/25 shadow-[0_0_10px_rgba(245,198,214,0.35)]'
    : 'bg-gradient-to-t from-rose-500/90 via-rose-400/55 to-pink-200/40 shadow-[0_0_8px_rgba(244,114,182,0.25)]'

  return (
    <div className="relative w-full" aria-hidden>
      <p
        className={`pointer-events-none absolute -top-5 left-1/2 w-max -translate-x-1/2 font-jp-hand text-[0.58rem] tracking-[0.35em] ${
          isNight ? 'text-sakura-pink/45' : 'text-rose-500/55'
        }`}
      >
        {caption}
      </p>
      <div className="flex h-12 items-end justify-center gap-[2px] px-0.5 sm:h-14 sm:gap-[3px]">
        {Array.from({ length: WAVE_BAR_COUNT }, (_, i) => (
          <div
            key={i}
            ref={(el) => {
              barsRef.current[i] = el
            }}
            className={`min-h-[4px] origin-bottom rounded-full transition-[filter] duration-150 ${barClass}`}
            style={{
              width: `${i % 6 === 0 ? 3 : i % 3 === 0 ? 2.5 : 2}px`,
              height: '14%',
              opacity: active ? 0.92 : 0.35,
            }}
          />
        ))}
      </div>
    </div>
  )
}

type HeroVoiceNoteCardProps = SectionProps & {
  onVoiceStreamChange?: (stream: MediaStream | null) => void
  onVoiceRecordingChange?: (recording: boolean) => void
  /** Override top spacing (default mt-8) when embedded in a custom hero layout. */
  contentTopClassName?: string
}

export function HeroVoiceNoteCard({
  theme,
  onVoiceStreamChange,
  onVoiceRecordingChange,
  contentTopClassName = 'mt-8',
}: HeroVoiceNoteCardProps) {
  const reduceMotion = useReducedMotion() ?? false
  const isNight = theme === 'night'
  const [email, setEmail] = useState('')
  const [warmNote, setWarmNote] = useState('')
  const [blob, setBlob] = useState<Blob | null>(null)
  const [recording, setRecording] = useState(false)
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<Status>(null)
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null)
  const [previewPlaying, setPreviewPlaying] = useState(false)
  const [playbackVizStream, setPlaybackVizStream] = useState<MediaStream | null>(null)
  const [sttLoading, setSttLoading] = useState(false)
  const [sttError, setSttError] = useState<string | null>(null)
  const [stt, setStt] = useState<{
    transcript: string
    segments: TranscriptSegment[]
    ja: string
    duration: number | null
    unavailable?: boolean
    message?: string
  } | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const micSelectRef = useRef<HTMLSelectElement>(null)
  const hearbackAudioRef = useRef<HTMLAudioElement | null>(null)
  const blobUrlRef = useRef<string | null>(null)
  const statusTimerRef = useRef(0)
  const micSelectId = useId()

  useEffect(() => {
    onVoiceStreamChange?.(activeStream)
  }, [activeStream, onVoiceStreamChange])

  useEffect(() => {
    onVoiceRecordingChange?.(recording)
  }, [recording, onVoiceRecordingChange])

  const refreshAudioInputs = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return
    try {
      const all = await navigator.mediaDevices.enumerateDevices()
      setAudioInputs(all.filter((d) => d.kind === 'audioinput'))
    } catch {
      setAudioInputs([])
    }
  }, [])

  useEffect(() => {
    void refreshAudioInputs()
    const md = navigator.mediaDevices
    if (!md?.addEventListener) return
    const onChange = () => void refreshAudioInputs()
    md.addEventListener('devicechange', onChange)
    return () => md.removeEventListener('devicechange', onChange)
  }, [refreshAudioInputs])

  const showStatus = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setStatus({ type, message })
    window.clearTimeout(statusTimerRef.current)
    statusTimerRef.current = window.setTimeout(() => setStatus(null), 6000)
  }, [])

  useEffect(() => {
    return () => {
      window.clearTimeout(statusTimerRef.current)
      mediaRecorderRef.current?.stop()
    }
  }, [])

  useEffect(() => {
    const audio = hearbackAudioRef.current
    if (!blob || blob.size < 200 || !audio) {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
      audio?.pause()
      setPreviewPlaying(false)
      setPlaybackVizStream(null)
      return
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
    const url = URL.createObjectURL(blob)
    blobUrlRef.current = url
    audio.src = url
    audio.load()
    return () => {
      URL.revokeObjectURL(url)
      if (blobUrlRef.current === url) blobUrlRef.current = null
      audio.pause()
      setPreviewPlaying(false)
      setPlaybackVizStream(null)
    }
  }, [blob])

  useEffect(() => {
    const el = hearbackAudioRef.current
    if (!el) return
    const onEnded = () => {
      setPreviewPlaying(false)
      setPlaybackVizStream(null)
    }
    el.addEventListener('ended', onEnded)
    return () => el.removeEventListener('ended', onEnded)
  }, [])

  const pickMime = () => {
    if (typeof MediaRecorder === 'undefined') return ''
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus'
    if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm'
    if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4'
    return ''
  }

  const stopRecording = useCallback(() => {
    const rec = mediaRecorderRef.current
    if (rec && rec.state !== 'inactive') {
      rec.stop()
    }
    setRecording(false)
    mediaRecorderRef.current = null
  }, [])

  const stopPreviewPlayback = useCallback(() => {
    const el = hearbackAudioRef.current
    el?.pause()
    setPreviewPlaying(false)
    setPlaybackVizStream(null)
  }, [])

  const toggleHearback = useCallback(async () => {
    const el = hearbackAudioRef.current
    if (!el || !blob || blob.size < 200) return
    if (previewPlaying) {
      stopPreviewPlayback()
      return
    }
    try {
      el.currentTime = 0
      await el.play()
      const extended = el as HTMLMediaElement & {
        captureStream?: () => MediaStream
        mozCaptureStream?: () => MediaStream
      }
      const cap =
        typeof extended.captureStream === 'function'
          ? extended.captureStream()
          : typeof extended.mozCaptureStream === 'function'
            ? extended.mozCaptureStream()
            : null
      setPlaybackVizStream(cap)
      setPreviewPlaying(true)
    } catch {
      showStatus('error', 'Could not play this recording in the browser.')
    }
  }, [blob, previewPlaying, stopPreviewPlayback, showStatus])

  useEffect(() => {
    if (!blob || blob.size < 200) {
      setStt(null)
      setSttError(null)
      setSttLoading(false)
      return
    }
    if (recording) return

    let cancelled = false
    setSttLoading(true)
    setSttError(null)

    const ext = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('mpeg') ? 'mp3' : 'webm'
    const fd = new FormData()
    fd.append('audio', blob, `preview.${ext}`)

    void fetch(apiUrl('/api/transcribe-preview'), { method: 'POST', body: fd })
      .then(async (res) => {
        const raw = await res.text().catch(() => '')
        let data: Record<string, unknown> | null = null
        if (raw) {
          try {
            data = JSON.parse(raw) as Record<string, unknown>
          } catch {
            data = null
          }
        }
        if (cancelled) return
        if (!res.ok) {
          const fromApi = typeof data?.message === 'string' ? data.message : ''
          setSttError(fromApi || friendlyApiErrorMessage(res.status, raw))
          setStt(null)
          return
        }
        const segments = Array.isArray(data?.segments)
          ? (data!.segments as TranscriptSegment[]).filter(
              (s) => s && typeof s.text === 'string' && typeof s.start === 'number' && typeof s.end === 'number',
            )
          : []
        setStt({
          transcript: typeof data?.transcript === 'string' ? data.transcript : '',
          segments,
          ja: typeof data?.ja === 'string' ? data.ja : '',
          duration: typeof data?.duration === 'number' ? data.duration : null,
          unavailable: Boolean(data?.unavailable),
          message: typeof data?.message === 'string' ? data.message : undefined,
        })
      })
      .catch(() => {
        if (!cancelled) {
          setSttError('Could not reach the API. Run npm run dev (site + backend together).')
          setStt(null)
        }
      })
      .finally(() => {
        if (!cancelled) setSttLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [blob, recording])

  const sttPanelOpen =
    Boolean(blob && !recording) &&
    (sttLoading ||
      sttError != null ||
      (stt != null &&
        (stt.transcript.length > 0 ||
          stt.segments.length > 0 ||
          stt.ja.length > 0 ||
          stt.unavailable)))

  const waveStream = recording ? activeStream : playbackVizStream
  const waveActive =
    (recording && activeStream != null) || (previewPlaying && playbackVizStream != null)

  const startRecording = async () => {
    stopPreviewPlayback()
    setStatus(null)
    setBlob(null)
    setStt(null)
    setSttError(null)
    setSttLoading(false)
    chunksRef.current = []
    try {
      const audio: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
      }
      if (selectedDeviceId) {
        audio.deviceId = { exact: selectedDeviceId }
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio })
      void refreshAudioInputs()
      setActiveStream(stream)
      const mime = pickMime()
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      mediaRecorderRef.current = rec
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        setActiveStream(null)
        const type = rec.mimeType || 'audio/webm'
        const b = new Blob(chunksRef.current, { type })
        setBlob(b)
        chunksRef.current = []
      }
      rec.start()
      setRecording(true)
    } catch {
      setActiveStream(null)
      showStatus('error', 'Microphone access is needed to record a voice note.')
    }
  }

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

  const submit = async () => {
    if (!isValidEmail(email)) {
      showStatus('error', 'Please enter a valid email.')
      return
    }
    if (!blob || blob.size < 200) {
      showStatus('error', 'Record a short voice note first.')
      return
    }
    try {
      setSending(true)
      const fd = new FormData()
      fd.append('email', email.trim())
      fd.append('warmNote', warmNote.trim())
      const ext = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('mpeg') ? 'mp3' : 'webm'
      fd.append('audio', blob, `recording.${ext}`)
      const res = await fetch(apiUrl('/api/voice-note'), { method: 'POST', body: fd })
      const data = res.headers.get('content-type')?.includes('json')
        ? await res.json().catch(() => null)
        : null
      if (!res.ok) {
        const msg =
          data && typeof data === 'object' && 'message' in data ? String(data.message) : 'Could not send.'
        showStatus('error', msg)
        return
      }
      showStatus(
        'success',
        'Sent — check your inbox for a thank-you note from the Cherry Blossom bot.'
      )
      setWarmNote('')
      setBlob(null)
    } catch {
      showStatus('error', 'Network error. Run npm run dev so the API is up.')
    } finally {
      setSending(false)
    }
  }

  const inputClass = isNight
    ? 'w-full rounded-xl border border-white/12 bg-black/35 px-3 py-2.5 text-sm text-parchment/95 outline-none ring-0 transition placeholder:text-parchment/45 focus:border-white/25 focus:bg-black/50 focus:ring-1 focus:ring-white/15'
    : 'w-full rounded-xl border border-[rgba(236,72,153,0.28)] bg-[color:var(--dawn-input)] px-3 py-2.5 text-sm text-[color:var(--dawn-text)] outline-none ring-0 transition placeholder:text-[color:var(--dawn-muted)] focus:border-rose-400/50 focus:bg-white focus:ring-2 focus:ring-rose-300/35'

  const sealClass = isNight
    ? 'border-white/20 bg-gradient-to-br from-black/60 to-black/85 text-parchment/90'
    : 'border-rose-400/45 bg-gradient-to-br from-rose-100/90 to-white text-rose-900/90'

  return (
    <motion.div
      className={`relative overflow-hidden p-5 sm:p-6 ${contentTopClassName} ${isNight ? nightGlassHeroVoice : dayGlassHeroVoice}`}
      variants={cardEnter}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 'some', margin: '0px 0px 80px 0px' }}
      whileHover={reduceMotion ? undefined : { y: -3, rotate: -0.4 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
    >
      {!reduceMotion && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-70"
          style={{
            background:
              'linear-gradient(115deg, transparent 30%, rgba(245,198,214,0.35) 45%, transparent 60%, rgba(245,198,214,0.2) 75%, transparent 90%)',
            backgroundSize: '240% 100%',
          }}
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          aria-hidden
        />
      )}
      <FloatingCardPetals isNight={isNight} reduced={reduceMotion} variant="bloom" />
      <motion.span
        className={`pointer-events-none absolute -right-1 -top-2 select-none font-jp-hand text-[4.5rem] leading-none sm:text-[5.5rem] ${
          isNight ? 'text-white/[0.04]' : 'text-rose-500/[0.07]'
        }`}
        aria-hidden
        animate={
          reduceMotion
            ? {}
            : {
                opacity: [0.035, 0.07, 0.045],
                scale: [1, 1.02, 1],
                rotate: [0, -1.5, 0],
              }
        }
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        音
      </motion.span>
      <motion.div
        className={`absolute left-5 top-5 h-12 w-px origin-top sm:left-6 sm:top-6 ${isNight ? 'bg-gradient-to-b from-sakura-pink/50 to-transparent' : 'bg-gradient-to-b from-rose-400/50 to-transparent'}`}
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.35, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden
      />

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <motion.div
          className={`flex shrink-0 flex-col items-center gap-2 sm:w-36 ${isNight ? '' : ''}`}
          initial={{ opacity: 0, x: reduceMotion ? 0 : -16, rotate: reduceMotion ? 0 : -4 }}
          whileInView={{ opacity: 1, x: 0, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.08 }}
        >
          <motion.div
            layout
            className={`relative flex h-20 w-20 items-center justify-center rounded-full border-2 shadow-lg sm:h-24 sm:w-24 ${sealClass}`}
            animate={
              recording && !reduceMotion
                ? { boxShadow: ['0 0 0 0 rgba(245,198,214,0.35)', '0 0 28px 6px rgba(245,198,214,0.2)', '0 0 0 0 rgba(245,198,214,0)'] }
                : {}
            }
            transition={{ duration: 2, repeat: recording && !reduceMotion ? Infinity : 0 }}
          >
            <motion.span
              className="font-jp-hand text-2xl sm:text-3xl"
              animate={
                recording
                  ? reduceMotion
                    ? { scale: 1.04 }
                    : { scale: [1, 1.08, 1], rotate: [0, 2, -2, 0] }
                  : { scale: 1, rotate: 0 }
              }
              transition={{ duration: reduceMotion ? 0.2 : 1.15, repeat: recording && !reduceMotion ? Infinity : 0 }}
            >
              印
            </motion.span>
            {recording && !reduceMotion && (
              <>
                <motion.span
                  className={`absolute inset-0 rounded-full border-2 ${isNight ? 'border-white/25' : 'border-rose-400/40'}`}
                  animate={{ scale: [1, 1.18, 1], opacity: [0.55, 0, 0.55] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                />
                <motion.span
                  className={`absolute inset-[-6px] rounded-full border ${isNight ? 'border-white/15' : 'border-rose-300/30'}`}
                  animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: 0.2 }}
                />
              </>
            )}
          </motion.div>
          <p className={`text-center font-jp-hand text-xs tracking-widest ${isNight ? 'text-sakura-pink/75' : 'text-rose-600/80'}`}>
            声の便り
          </p>
          <p className={`text-center text-[0.6rem] uppercase tracking-[0.28em] ${isNight ? 'text-parchment/45' : 'text-[color:var(--dawn-muted)]'}`}>
            Voice offering
          </p>
        </motion.div>

        <motion.div
          className="min-w-0 flex-1 space-y-3"
          variants={contentStagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div variants={contentItem}>
            <h2 className={`font-heading text-lg sm:text-xl ${isNight ? 'text-parchment/95' : 'text-[color:var(--dawn-text)]'}`}>
              Send a voice note
            </h2>
            <p className={`mt-1 text-[0.8rem] leading-relaxed sm:text-sm ${isNight ? 'text-parchment/65' : 'text-[color:var(--dawn-muted)]'}`}>
              Leave your email, add a warm typed note if you like, then share a short recording. The portfolio bot
              delivers it safely — then you&apos;ll get a handwritten-style reply from{' '}
              <strong
                className={
                  isNight ? 'font-medium text-parchment/90' : 'font-medium text-[color:var(--dawn-text)]'
                }
              >
                Hrithik
              </strong>
              <span className={isNight ? 'text-parchment/55' : 'text-[color:var(--dawn-muted)]'}>
                , or sometimes a thoughtful line from the{' '}
              </span>
              <strong
                className={
                  isNight ? 'font-medium text-parchment/90' : 'font-medium text-[color:var(--dawn-text)]'
                }
              >
                AI he trained
              </strong>
              <span role="img" aria-label="Wink">
                {' '}
                😉
              </span>
            </p>
          </motion.div>

          <motion.label className="block" variants={contentItem}>
            <span className={`mb-1 block text-[0.62rem] font-medium uppercase tracking-[0.2em] ${isNight ? 'text-parchment/55' : 'text-[color:var(--dawn-muted)]'}`}>
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </motion.label>

          <motion.label className="block" variants={contentItem}>
            <span className={`mb-1 block text-[0.62rem] font-medium uppercase tracking-[0.2em] ${isNight ? 'text-parchment/55' : 'text-[color:var(--dawn-muted)]'}`}>
              Warm note <span className="font-normal normal-case tracking-normal opacity-70">(optional)</span>
            </span>
            <textarea
              value={warmNote}
              onChange={(e) => setWarmNote(e.target.value)}
              rows={2}
              className={`${inputClass} resize-none`}
              placeholder="A line of context, gratitude, or encouragement…"
            />
          </motion.label>

          <motion.div variants={contentItem} className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className={`text-[0.62rem] font-medium uppercase tracking-[0.2em] ${isNight ? 'text-parchment/55' : 'text-[color:var(--dawn-muted)]'}`}
              >
                Microphone
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <motion.button
                  type="button"
                  disabled={recording}
                  onClick={() => {
                    micSelectRef.current?.focus()
                    micSelectRef.current?.click()
                  }}
                  className={`rounded-full border px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40 ${
                    isNight
                      ? 'border-sakura-pink/45 bg-sakura-pink/10 text-parchment/85 hover:bg-sakura-pink/18 focus-visible:ring-sakura-pink/50'
                      : 'border-rose-300/55 bg-rose-50/90 text-rose-900 hover:bg-rose-100/90 focus-visible:ring-rose-400/50'
                  }`}
                  whileTap={{ scale: recording ? 1 : 0.96 }}
                >
                  Change mic
                </motion.button>
                <button
                  type="button"
                  disabled={recording}
                  onClick={() => void refreshAudioInputs()}
                  className={`rounded-full border px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40 ${
                    isNight
                      ? 'border-pink-300/40 bg-black/30 text-parchment/75 hover:bg-pink-500/10 focus-visible:ring-sakura-pink/50'
                      : 'border-rose-200/60 bg-white/80 text-rose-800/90 hover:bg-rose-50 focus-visible:ring-rose-400/50'
                  }`}
                >
                  Refresh list
                </button>
              </div>
            </div>
            <select
              id={micSelectId}
              ref={micSelectRef}
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              disabled={recording}
              aria-label="Choose microphone"
              title={recording ? 'Stop recording to change microphone' : 'Change microphone'}
              className={`${inputClass} cursor-pointer py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <option value="">Default microphone</option>
              {audioInputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label?.trim() || `Input ${d.deviceId.slice(0, 6)}…`}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div
            variants={contentItem}
            layout
            className={`rounded-xl border px-3 py-3 transition-shadow duration-300 ${isNight ? 'border-white/10 bg-black/30' : 'border-rose-200/40 bg-white/60'} ${
              recording || previewPlaying
                ? isNight
                  ? 'shadow-[0_0_32px_rgba(245,198,214,0.15)] ring-1 ring-sakura-pink/25'
                  : 'shadow-[0_8px_32px_rgba(244,114,182,0.12)] ring-1 ring-rose-200/50'
                : ''
            }`}
          >
            <audio ref={hearbackAudioRef} className="hidden" playsInline preload="auto" />
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {!recording ? (
                  <motion.button
                    type="button"
                    onClick={startRecording}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                      isNight
                        ? 'border-ink-red/60 bg-ink-red/25 text-parchment/95 hover:bg-ink-red/40 focus-visible:ring-sakura-pink/60'
                        : 'border-rose-400/55 bg-rose-50 text-rose-900 hover:bg-rose-100 focus-visible:ring-rose-400/50'
                    }`}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span className="relative flex h-2.5 w-2.5 rounded-full bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.7)]" />
                    Record
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    onClick={stopRecording}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] focus-visible:outline-none focus-visible:ring-2 ${
                      isNight
                        ? 'border-sakura-pink/50 bg-sakura-pink/15 text-parchment/95 focus-visible:ring-sakura-pink/50'
                        : 'border-rose-300/60 bg-white text-rose-900 focus-visible:ring-rose-400/50'
                    }`}
                    whileTap={{ scale: 0.97 }}
                    animate={{ boxShadow: ['0 0 0 0 rgba(245,198,214,0.4)', '0 0 0 10px rgba(245,198,214,0)', '0 0 0 0 rgba(245,198,214,0)'] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  >
                    Stop
                  </motion.button>
                )}
                {blob && !recording ? (
                  <>
                    <motion.button
                      type="button"
                      onClick={() => void toggleHearback()}
                      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] focus-visible:outline-none focus-visible:ring-2 ${
                        isNight
                          ? previewPlaying
                            ? 'border-sakura-pink/55 bg-sakura-pink/20 text-parchment/95 shadow-[0_0_20px_rgba(245,198,214,0.2)] focus-visible:ring-sakura-pink/50'
                            : 'border-white/18 bg-white/[0.07] text-parchment/88 hover:bg-white/12 focus-visible:ring-sakura-pink/45'
                          : previewPlaying
                            ? 'border-rose-400/60 bg-rose-100/90 text-rose-950 shadow-[0_6px_24px_rgba(244,114,182,0.2)] focus-visible:ring-rose-400/55'
                            : 'border-rose-200/70 bg-white/90 text-rose-900 hover:bg-rose-50/95 focus-visible:ring-rose-400/45'
                      }`}
                      layout
                      whileHover={reduceMotion ? undefined : { scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      animate={
                        reduceMotion || !previewPlaying
                          ? {}
                          : {
                              boxShadow: [
                                '0 0 0 0 rgba(245,198,214,0.35)',
                                '0 0 0 12px rgba(245,198,214,0)',
                                '0 0 0 0 rgba(245,198,214,0)',
                              ],
                            }
                      }
                      transition={
                        previewPlaying && !reduceMotion
                          ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
                          : { duration: 0.2 }
                      }
                      aria-label={previewPlaying ? 'Pause hearback' : 'Play recording (hearback)'}
                    >
                      {previewPlaying ? (
                        <span className="flex h-3.5 w-3.5 items-center justify-center gap-0.5" aria-hidden>
                          <span className="h-3 w-0.5 rounded-sm bg-current" />
                          <span className="h-3 w-0.5 rounded-sm bg-current" />
                        </span>
                      ) : (
                        <motion.span
                          className="relative block h-0 w-0 border-y-[6px] border-l-[10px] border-y-transparent border-l-current"
                          aria-hidden
                          initial={false}
                          animate={reduceMotion ? {} : { x: [0, 2, 0] }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      )}
                      Hear back
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => {
                        stopPreviewPlayback()
                        setBlob(null)
                        chunksRef.current = []
                      }}
                      className={`text-[0.62rem] uppercase tracking-[0.16em] underline-offset-4 hover:underline ${isNight ? 'text-parchment/55' : 'text-[color:var(--dawn-muted)]'}`}
                    >
                      Discard
                    </button>
                  </>
                ) : null}
              </div>
              <div className="min-w-0 flex-1 sm:min-w-[200px] sm:max-w-[min(100%,280px)]">
                <JapaneseVoiceWave
                  stream={waveStream}
                  active={waveActive}
                  isNight={isNight}
                  reduced={reduceMotion}
                  silenceAutoStop={recording}
                  onSilenceStop={stopRecording}
                  caption={previewPlaying ? '聴き返し' : '音の波'}
                />
              </div>
            </div>
            <p className={`mt-2 text-[0.65rem] ${isNight ? 'text-parchment/45' : 'text-[color:var(--dawn-muted)]'}`}>
              {blob && !recording && previewPlaying && playbackVizStream
                ? 'Playing your take — the wave follows the audio. 再生中、波形が音声に同期します。'
                : blob && !recording && previewPlaying
                  ? 'Playing your take. Wave sync needs a browser with audio captureStream() (e.g. Chromium). 再生中。'
                  : blob && !recording
                  ? `Ready · ${(blob.size / 1024).toFixed(0)} KB — hear back or send below.`
                  : recording
                    ? 'Listening… A ~1.4s pause after you speak will end the take (auto-stop). 話し終えて約1.4秒で自動停止。'
                    : 'Your browser will ask for mic permission once.'}
            </p>
          </motion.div>

          <AnimatePresence>
            {sttPanelOpen ? (
              <motion.div key="stt" variants={contentItem} initial="hidden" animate="show" exit="hidden">
                <VoiceTranscriptPreview
                  isNight={isNight}
                  reduced={reduceMotion}
                  loading={sttLoading}
                  error={sttError}
                  transcript={stt?.transcript ?? ''}
                  segments={stt?.segments ?? []}
                  ja={stt?.ja ?? ''}
                  duration={stt?.duration ?? null}
                  unavailable={stt?.unavailable}
                  hint={stt?.message}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <motion.div className="flex flex-wrap items-end justify-between gap-3 pt-1" variants={contentItem}>
            <motion.button
              type="button"
              disabled={sending || !blob}
              onClick={submit}
              className={`relative inline-flex items-center gap-2 overflow-hidden rounded-full border px-5 py-2.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] transition-all focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-45 ${
                isNight
                  ? 'border-sakura-pink/45 bg-sakura-pink/10 text-parchment/95 hover:bg-sakura-pink/20 focus-visible:ring-sakura-pink/50'
                  : 'border-rose-300/55 bg-gradient-to-r from-rose-50 to-pink-50 text-[color:var(--dawn-text)] hover:from-rose-100 hover:to-pink-50 focus-visible:ring-rose-400/50'
              }`}
              whileTap={{ scale: sending ? 1 : 0.98 }}
              animate={
                blob && !sending && !reduceMotion
                  ? { scale: [1, 1.02, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: 2.2, repeat: blob && !sending && !reduceMotion ? Infinity : 0 }}
            >
              {blob && !sending && !reduceMotion && (
                <motion.span
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 0.8 }}
                  aria-hidden
                />
              )}
              <span className="relative z-[1]">{sending ? 'Sending…' : 'Send voice note'}</span>
            </motion.button>

            <div className="flex min-h-[44px] max-w-[min(100%,260px)] flex-1 items-center justify-end sm:max-w-[260px]">
              <AnimatePresence mode="wait">
                {status ? (
                  <motion.div
                    key={status.message}
                    role="status"
                    aria-live="polite"
                    className={`rounded-xl border px-3 py-2 text-right text-[0.68rem] leading-relaxed ${
                      status.type === 'success'
                        ? isNight
                          ? 'border-emerald-400/35 bg-emerald-950/30 text-emerald-100'
                          : 'border-emerald-300/50 bg-emerald-50 text-emerald-900'
                        : status.type === 'info'
                          ? isNight
                            ? 'border-pink-300/40 bg-black/40 text-parchment/85'
                            : 'border-rose-200/60 bg-rose-50 text-rose-900'
                          : isNight
                            ? 'border-rose-400/40 bg-rose-950/30 text-rose-100'
                            : 'border-rose-300/55 bg-rose-50 text-rose-900'
                    }`}
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22 }}
                  >
                    {status.message}
                  </motion.div>
                ) : (
                  <motion.p
                    key="idle"
                    className={`text-right text-[0.65rem] leading-relaxed ${isNight ? 'text-parchment/50' : 'text-[color:var(--dawn-muted)]'}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    一期一会 — each note is unique.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className={`pointer-events-none absolute bottom-3 right-4 h-px w-24 origin-right sm:w-32 ${isNight ? 'bg-gradient-to-l from-sakura-pink/30 to-transparent' : 'bg-gradient-to-l from-rose-300/50 to-transparent'}`}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.9 }}
        aria-hidden
      />
    </motion.div>
  )
}
