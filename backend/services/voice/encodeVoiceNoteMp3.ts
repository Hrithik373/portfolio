import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { readFile, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import ffmpegStatic from 'ffmpeg-static'

/** Max practical MP3 quality: 320 kbps CBR, 48 kHz, stereo (mono sources are upmixed). */
const BITRATE = '320k'
const SAMPLE_RATE = '48000'

function resolveFfmpegPath(): string | null {
  const fromEnv = process.env.FFMPEG_BIN?.trim()
  if (fromEnv) return fromEnv
  return ffmpegStatic
}

/**
 * Re-encode arbitrary browser-captured audio (webm / m4a / mp3) to a high-bitrate MP3
 * for email attachments. Returns null if ffmpeg is missing or conversion fails.
 */
export async function encodeVoiceNoteToMp3Hd(
  inputBuffer: Buffer,
  inputExtension: string
): Promise<Buffer | null> {
  const ffmpegPath = resolveFfmpegPath()
  if (!ffmpegPath) {
    console.warn('[voice-note-mp3] No ffmpeg binary (install ffmpeg-static or set FFMPEG_BIN).')
    return null
  }

  const safeExt = inputExtension.replace(/[^a-z0-9]/gi, '') || 'webm'
  const id = randomUUID()
  const inPath = path.join(tmpdir(), `voice-note-in-${id}.${safeExt}`)
  const outPath = path.join(tmpdir(), `voice-note-out-${id}.mp3`)

  try {
    await writeFile(inPath, inputBuffer)

    await new Promise<void>((resolve, reject) => {
      const args = [
        '-hide_banner',
        '-loglevel',
        'error',
        '-y',
        '-i',
        inPath,
        '-vn',
        '-map_metadata',
        '-1',
        '-codec:a',
        'libmp3lame',
        '-b:a',
        BITRATE,
        '-ar',
        SAMPLE_RATE,
        '-ac',
        '2',
        outPath,
      ]
      const proc = spawn(ffmpegPath, args, {
        windowsHide: true,
        stdio: ['ignore', 'ignore', 'pipe'],
      })
      let stderr = ''
      proc.stderr?.on('data', (c: Buffer) => {
        stderr += c.toString()
      })
      const timer = setTimeout(() => {
        proc.kill('SIGTERM')
        reject(new Error('ffmpeg timeout'))
      }, 90_000)
      proc.on('error', (err) => {
        clearTimeout(timer)
        reject(err)
      })
      proc.on('close', (code) => {
        clearTimeout(timer)
        if (code === 0) resolve()
        else reject(new Error(stderr.trim().slice(-500) || `ffmpeg exited ${code}`))
      })
    })

    return await readFile(outPath)
  } catch (e) {
    console.warn('[voice-note-mp3] encode failed', e instanceof Error ? e.message : e)
    return null
  } finally {
    await unlink(inPath).catch(() => {})
    await unlink(outPath).catch(() => {})
  }
}
