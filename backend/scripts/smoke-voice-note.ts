/**
 * Self-contained API checks: spawns the backend on a free PORT, hits voice-note + transcribe-preview, exits.
 *
 * Run: npm run test:voice-note
 */
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '../..')
const port = Number(process.env.SMOKE_PORT || 8791)

async function waitForServer(stdout: NodeJS.ReadableStream, ms: number) {
  const start = Date.now()
  return new Promise<void>((resolve, reject) => {
    const onData = (chunk: Buffer) => {
      const s = chunk.toString()
      if (s.includes('listening') || s.includes('Backend')) {
        cleanup()
        resolve()
      }
    }
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error(`Server did not log ready within ${ms}ms`))
    }, ms)
    const cleanup = () => {
      clearTimeout(timer)
      stdout.removeListener('data', onData)
    }
    stdout.on('data', onData)
  })
}

async function main() {
  const proc = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsx', 'backend/server.ts'], {
    cwd: projectRoot,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  })

  let stderr = ''
  proc.stderr?.on('data', (c) => {
    stderr += c.toString()
  })

  try {
    await waitForServer(proc.stdout!, 12000)
  } catch (e) {
    proc.kill('SIGTERM')
    console.error(stderr.slice(-800))
    throw e
  }

  const base = `http://127.0.0.1:${port}`

  try {
    const ping = await fetch(`${base}/api/voice-note`)
    const pingJson = await ping.json()
    console.log('[1] GET /api/voice-note →', ping.status, pingJson)
    if (!ping.ok) throw new Error('GET voice-note failed')

    const health = await fetch(`${base}/api/health`)
    console.log('[2] GET /api/health →', health.status, await health.json())

    const fdMissingAudio = new FormData()
    fdMissingAudio.append('email', 'voice-smoke@example.com')
    const r1 = await fetch(`${base}/api/voice-note`, { method: 'POST', body: fdMissingAudio })
    const j1 = await r1.json().catch(() => ({}))
    console.log('[3] POST without audio →', r1.status, j1)
    if (r1.status !== 400) throw new Error('Expected 400 without audio')

    const fdBadEmail = new FormData()
    fdBadEmail.append('email', 'not-an-email')
    const dummy = new Uint8Array(512).fill(7)
    fdBadEmail.append('audio', new Blob([dummy], { type: 'audio/webm' }), 'recording.webm')
    const r2 = await fetch(`${base}/api/voice-note`, { method: 'POST', body: fdBadEmail })
    const j2 = await r2.json().catch(() => ({}))
    console.log('[4] POST invalid email →', r2.status, j2)
    if (r2.status !== 400) throw new Error('Expected 400 for bad email')

    const fdOk = new FormData()
    fdOk.append('email', 'voice-smoke@example.com')
    fdOk.append('warmNote', 'Automated smoke test — safe to ignore.')
    const payload = new Uint8Array(2048)
    for (let i = 0; i < payload.length; i++) payload[i] = i % 251
    fdOk.append('audio', new Blob([payload], { type: 'audio/webm' }), 'recording.webm')

    const r3 = await fetch(`${base}/api/voice-note`, { method: 'POST', body: fdOk })
    const raw3 = await r3.text()
    let j3: unknown
    try {
      j3 = JSON.parse(raw3)
    } catch {
      j3 = raw3.slice(0, 160)
    }
    console.log('[5] POST dummy webm →', r3.status, j3)

    if (r3.status === 500 && typeof j3 === 'object' && j3 && 'message' in j3) {
      const msg = String((j3 as { message: string }).message)
      if (msg.includes('not configured')) {
        console.log('    SMTP not configured — validation + routing OK.')
      } else {
        throw new Error(`Unexpected 500: ${msg}`)
      }
    } else if (r3.status !== 200) {
      throw new Error(`Expected 200 or SMTP 500, got ${r3.status}`)
    } else {
      console.log('    Full send OK (check inbox if SMTP set).')
    }

    const tpGet = await fetch(`${base}/api/transcribe-preview`)
    const tpGetJson = await tpGet.json()
    console.log('[6] GET /api/transcribe-preview →', tpGet.status, tpGetJson)
    if (!tpGet.ok) throw new Error('GET transcribe-preview failed')

    const fdTpEmpty = new FormData()
    const tpNoFile = await fetch(`${base}/api/transcribe-preview`, { method: 'POST', body: fdTpEmpty })
    const tpNoFileJ = await tpNoFile.json().catch(() => ({}))
    console.log('[7] POST transcribe-preview (no audio field) →', tpNoFile.status, tpNoFileJ)
    if (tpNoFile.status !== 400) throw new Error('Expected 400 without audio')

    const tiny = new Uint8Array(40).fill(1)
    const fdTiny = new FormData()
    fdTiny.append('audio', new Blob([tiny], { type: 'audio/webm' }), 'preview.webm')
    const tpTiny = await fetch(`${base}/api/transcribe-preview`, { method: 'POST', body: fdTiny })
    const tpTinyJ = await tpTiny.json().catch(() => ({}))
    console.log('[8] POST transcribe-preview (clip < 80 B) →', tpTiny.status, tpTinyJ)
    if (tpTiny.status !== 400) throw new Error('Expected 400 for clip under 80 bytes')

    const fdDummy = new FormData()
    const prevBytes = new Uint8Array(400).fill(11)
    fdDummy.append('audio', new Blob([prevBytes], { type: 'audio/webm' }), 'preview.webm')
    const tpDummy = await fetch(`${base}/api/transcribe-preview`, { method: 'POST', body: fdDummy })
    const tpDummyJ = (await tpDummy.json().catch(() => null)) as Record<string, unknown> | null
    console.log('[9] POST transcribe-preview (dummy webm) →', tpDummy.status, tpDummyJ)

    if (tpDummy.status === 200) {
      if (tpDummyJ?.unavailable === true) {
        console.log('    No OPENAI_API_KEY — handler returned unavailable (expected).')
      } else {
        console.log('    OPENAI configured — got JSON (transcript may be empty for junk bytes).')
      }
    } else if (tpDummy.status === 502) {
      console.log('    OpenAI rejected non-audio payload (502) — key + route OK.')
    } else {
      throw new Error(`Unexpected transcribe-preview status ${tpDummy.status}`)
    }

    if (process.env.OPENAI_API_KEY) {
      console.log('[*] OPENAI_API_KEY is set — real mic clips should hit Whisper.')
    }
    console.log('All API smoke checks passed.')
  } finally {
    proc.kill('SIGTERM')
    await once(proc, 'close').catch(() => {})
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
