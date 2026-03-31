import { useEffect, useRef } from 'react'

const RMS_LOUD = 0.032
const RMS_QUIET = 0.016
const SILENCE_MS = 1400
const MIN_RECORD_MS = 1100
const MAX_AUTO_MS = 120_000

type Options = {
  stream: MediaStream | null
  active: boolean
  /** Skip analyser loop (e.g. reduced motion preference). */
  disabled: boolean
  onSilenceStop: () => void
}

/**
 * Stops recording after sustained silence following speech (browser mic RMS).
 */
export function useSilenceAutoStop({ stream, active, disabled, onSilenceStop }: Options) {
  const stopRef = useRef(onSilenceStop)
  stopRef.current = onSilenceStop
  const firedRef = useRef(false)

  useEffect(() => {
    firedRef.current = false
  }, [active, stream])

  useEffect(() => {
    if (!stream || !active || disabled) {
      return
    }

    let raf = 0
    let ctx: AudioContext | null = null
    let cancelled = false

    const run = async () => {
      try {
        ctx = new AudioContext()
        await ctx.resume().catch(() => {})
        if (cancelled) {
          void ctx.close().catch(() => {})
          return
        }

        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 512
        analyser.smoothingTimeConstant = 0.45
        source.connect(analyser)

        const data = new Uint8Array(analyser.fftSize)
        const recordStart = performance.now()
        let speechDetected = false
        let silenceStart: number | null = null

        const tick = () => {
          if (cancelled) return

          const now = performance.now()
          if (now - recordStart > MAX_AUTO_MS) {
            if (!firedRef.current) {
              firedRef.current = true
              stopRef.current()
            }
            return
          }

          analyser.getByteTimeDomainData(data)
          let sum = 0
          for (let i = 0; i < data.length; i++) {
            const x = (data[i]! - 128) / 128
            sum += x * x
          }
          const rms = Math.sqrt(sum / data.length)

          if (rms > RMS_LOUD) {
            speechDetected = true
            silenceStart = null
          } else if (rms < RMS_QUIET && speechDetected) {
            if (silenceStart === null) silenceStart = now
            else if (
              now - silenceStart >= SILENCE_MS &&
              now - recordStart >= MIN_RECORD_MS &&
              !firedRef.current
            ) {
              firedRef.current = true
              stopRef.current()
              return
            }
          }

          raf = requestAnimationFrame(tick)
        }

        raf = requestAnimationFrame(tick)
      } catch {
        /* ignore — recording still works without auto-stop */
      }
    }

    void run()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      void ctx?.close().catch(() => {})
    }
  }, [stream, active, disabled])
}
