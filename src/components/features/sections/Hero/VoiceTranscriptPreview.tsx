import { AnimatePresence, motion } from 'framer-motion'

import { VoiceCardPetals } from '../../petals/VoiceCardPetals';

export type TranscriptSegment = { start: number; end: number; text: string }

function formatTimecode(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  const sec = m > 0 ? s.toFixed(1).padStart(4, '0') : s.toFixed(1)
  return m > 0 ? `${m}:${sec}` : `${sec}s`
}

type Props = {
  isNight: boolean
  reduced: boolean
  loading: boolean
  error: string | null
  transcript: string
  segments: TranscriptSegment[]
  ja: string
  duration: number | null
  unavailable?: boolean
  hint?: string
}

/**
 * Whisper-style timed transcript + Japanese translation, with light motion.
 */
export function VoiceTranscriptPreview({
  isNight,
  reduced,
  loading,
  error,
  transcript,
  segments,
  ja,
  duration,
  unavailable,
  hint,
}: Props) {
  const shell = isNight
    ? 'border-sakura-pink/20 bg-black/40 text-parchment/90'
    : 'border-rose-200/45 bg-white/75 text-[color:var(--dawn-text)]'

  const muted = isNight ? 'text-parchment/50' : 'text-[color:var(--dawn-muted)]'
  const accent = isNight ? 'text-sakura-pink/80' : 'text-rose-600/85'

  const showBody = !loading && !error && (transcript || segments.length > 0 || ja || unavailable)

  /* ── Added: relative wrapper + VoiceCardPetals sibling ── */
  return (
    <div className="relative">
      {!reduced && <VoiceCardPetals isNight={isNight} />}

      <motion.div
        layout
        className={`relative z-[2] overflow-hidden rounded-xl border ${shell}`}
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduced ? undefined : { opacity: 0, y: -6 }}
        transition={{ duration: reduced ? 0.2 : 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="space-y-3 px-3 py-3 sm:px-4 sm:py-3.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className={`font-jp-hand text-xs tracking-[0.35em] ${accent}`}>音声の文字起こし</p>
              <p className={`text-[0.58rem] uppercase tracking-[0.22em] ${muted}`}>Whisper STT · timed</p>
            </div>
            {duration != null && duration > 0 && (
              <motion.span
                className={`tabular-nums text-[0.65rem] font-medium ${muted}`}
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {formatTimecode(0)} → {formatTimecode(duration)}
              </motion.span>
            )}
          </div>

          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                className="space-y-2 py-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className={`h-2 overflow-hidden rounded-full ${isNight ? 'bg-white/10' : 'bg-rose-100'}`}>
                  {!reduced && (
                    <motion.div
                      className={`h-full w-1/3 rounded-full ${isNight ? 'bg-sakura-pink/50' : 'bg-rose-400/70'}`}
                      animate={{ x: ['-30%', '220%'] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                </div>
                <p className={`text-center text-[0.65rem] ${muted}`}>聞き取り中… / Transcribing…</p>
              </motion.div>
            )}

            {error && (
              <motion.p
                key="err"
                className={`text-[0.72rem] ${isNight ? 'text-rose-200/90' : 'text-rose-700'}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {error}
              </motion.p>
            )}

            {showBody && (
              <motion.div
                key="body"
                className="space-y-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                {unavailable && hint ? (
                  <p className={`text-[0.72rem] leading-relaxed ${muted}`}>{hint}</p>
                ) : null}

                {duration != null && duration > 0 && segments.length > 0 && (
                  <div
                    className={`relative h-2 overflow-hidden rounded-full ${isNight ? 'bg-white/8' : 'bg-rose-100/90'}`}
                    aria-hidden
                  >
                    {segments.map((seg, i) => {
                      const w = Math.max(1, ((seg.end - seg.start) / duration) * 100)
                      const left = (seg.start / duration) * 100
                      return (
                        <motion.div
                          key={`${seg.start}-${i}`}
                          className={`absolute top-0 h-full rounded-sm ${isNight ? 'bg-sakura-pink/45' : 'bg-rose-400/55'}`}
                          style={{ left: `${left}%`, width: `${w}%`, transformOrigin: 'left' }}
                          initial={reduced ? false : { scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        />
                      )
                    })}
                  </div>
                )}

                <div className="max-h-[11rem] space-y-2 overflow-y-auto pr-1 text-[0.78rem] leading-relaxed sm:max-h-[14rem]">
                  {segments.length > 0
                    ? segments.map((seg, i) => (
                        <motion.div
                          key={`${seg.start}-${seg.end}-${i}`}
                          className="flex gap-2 border-b border-white/5 pb-2 last:border-0 last:pb-0"
                          initial={reduced ? false : { opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <span
                            className={`shrink-0 tabular-nums text-[0.62rem] ${muted} w-[4.5rem] sm:w-[5.25rem]`}
                          >
                            {formatTimecode(seg.start)} – {formatTimecode(seg.end)}
                          </span>
                          <p className="min-w-0 flex-1">{seg.text}</p>
                        </motion.div>
                      ))
                    : transcript
                      ? (
                          <p>{transcript}</p>
                        )
                      : null}
                </div>

                {ja ? (
                  <motion.div
                    className={`rounded-lg border px-2.5 py-2 ${isNight ? 'border-sakura-pink/25 bg-sakura-pink/[0.06]' : 'border-rose-200/50 bg-rose-50/80'}`}
                    initial={reduced ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12, duration: 0.4 }}
                  >
                    <p className={`font-jp-hand text-[0.65rem] tracking-wider ${accent}`}>日本語訳</p>
                    <p className="mt-1 text-[0.8rem] leading-relaxed">{ja}</p>
                  </motion.div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
