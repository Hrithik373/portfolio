import type { Request, Response } from 'express'

import { translateTextToJapanese } from '../services/translate/googleTranslateJa'
import type { WhisperSegment } from '../services/voice/whisperTranscribe'
import { transcribeWithWhisperVerbose } from '../services/voice/whisperTranscribe'

/**
 * Live preview: transcribe a short clip for the hero voice card (no email / no SMTP).
 * Optional Japanese line via Google Translate when GOOGLE_TRANSLATE_API_KEY is set.
 */
export async function transcribePreviewHandler(req: Request, res: Response) {
  try {
    const file = (req as Request & { file?: Express.Multer.File }).file

    if (!file?.buffer || file.buffer.length < 80) {
      return res.status(400).json({ message: 'Please upload a short audio clip.' })
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({
        transcript: '',
        segments: [] as WhisperSegment[],
        ja: '',
        duration: null as number | null,
        unavailable: true,
        message: 'Add OPENAI_API_KEY on the server for Whisper transcription.',
      })
    }

    const ext =
      file.mimetype?.includes('mp4') || file.originalname?.toLowerCase().endsWith('.m4a')
        ? 'm4a'
        : file.mimetype?.includes('mpeg') || file.originalname?.toLowerCase().endsWith('.mp3')
          ? 'mp3'
          : 'webm'

    const { text, segments, duration, apiError } = await transcribeWithWhisperVerbose(
      file.buffer,
      file.originalname || `preview.${ext}`,
      file.mimetype || `audio/${ext}`,
    )

    if (apiError) {
      return res.status(502).json({
        message: apiError,
      })
    }

    const ja = text ? await translateTextToJapanese(text) : ''

    return res.json({
      transcript: text,
      segments,
      ja,
      duration,
      unavailable: false,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unexpected server error.'
    console.error('[transcribe-preview]', e)
    return res.status(500).json({ message: msg })
  }
}
