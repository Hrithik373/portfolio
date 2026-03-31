import { fetchWithTimeout } from '../../utils/http'

export type WhisperSegment = { start: number; end: number; text: string }

/**
 * Transcribe short voice clips with OpenAI Whisper (requires OPENAI_API_KEY).
 * Plain `json` response — used by email pipeline (no segment payload).
 */
export async function transcribeWithWhisper(
  audioBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    return ''
  }

  const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType || 'audio/webm' })
  const form = new FormData()
  form.append('file', blob, filename || 'recording.webm')
  form.append('model', process.env.OPENAI_WHISPER_MODEL || 'whisper-1')

  try {
    const response = await fetchWithTimeout(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
        },
        body: form,
      },
      45000
    )

    if (!response.ok) {
      const err = await response.text().catch(() => '')
      console.warn('[whisper]', response.status, err.slice(0, 200))
      return ''
    }

    const data = (await response.json()) as { text?: string }
    return (data.text || '').trim()
  } catch (e) {
    console.warn('[whisper] request failed', e)
    return ''
  }
}

/**
 * Same as {@link transcribeWithWhisper} but returns timed segments (Whisper `verbose_json`).
 * Compatible with the same models as local whisper.cpp pipelines; this server uses the OpenAI API.
 */
export type WhisperVerboseResult = {
  text: string
  segments: WhisperSegment[]
  duration: number | null
  /** Set when OpenAI returns a non-OK response or the body cannot be parsed. */
  apiError?: string
}

function parseOpenAiErrorBody(status: number, raw: string): string {
  const trimmed = raw.trim().slice(0, 500)
  try {
    const j = JSON.parse(trimmed) as { error?: { message?: string } }
    if (j?.error?.message) return j.error.message
  } catch {
    /* ignore */
  }
  return trimmed || `OpenAI returned HTTP ${status}`
}

export async function transcribeWithWhisperVerbose(
  audioBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<WhisperVerboseResult> {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    return { text: '', segments: [], duration: null }
  }

  const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType || 'audio/webm' })
  const form = new FormData()
  form.append('file', blob, filename || 'recording.webm')
  form.append('model', process.env.OPENAI_WHISPER_MODEL || 'whisper-1')
  form.append('response_format', 'verbose_json')

  try {
    const response = await fetchWithTimeout(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
        },
        body: form,
      },
      55000
    )

    const raw = await response.text().catch(() => '')

    if (!response.ok) {
      const apiError = parseOpenAiErrorBody(response.status, raw)
      console.warn('[whisper]', response.status, apiError)
      return { text: '', segments: [], duration: null, apiError }
    }

    let data: {
      text?: string
      duration?: number
      segments?: Array<{ start?: number; end?: number; text?: string }>
    }
    try {
      data = JSON.parse(raw) as typeof data
    } catch {
      return {
        text: '',
        segments: [],
        duration: null,
        apiError: 'OpenAI returned invalid JSON for verbose_json transcription.',
      }
    }

    const segments: WhisperSegment[] = (data.segments ?? [])
      .map((s) => ({
        start: typeof s.start === 'number' ? s.start : 0,
        end: typeof s.end === 'number' ? s.end : 0,
        text: (s.text || '').trim(),
      }))
      .filter((s) => s.text.length > 0)

    const text = (data.text || '').trim()
    const duration = typeof data.duration === 'number' ? data.duration : null

    return { text, segments, duration }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn('[whisper] request failed', e)
    return {
      text: '',
      segments: [],
      duration: null,
      apiError: /abort/i.test(msg) ? 'Transcription timed out. Try a shorter clip.' : msg,
    }
  }
}
