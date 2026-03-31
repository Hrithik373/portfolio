/**
 * Spawn backend, hit /api/transcribe-preview only. Run: npx tsx backend/scripts/smoke-transcribe-preview.ts
 */
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '../..')
const port = Number(process.env.SMOKE_PORT || 8792)

async function waitForServer(stdout: NodeJS.ReadableStream, ms: number) {
  return new Promise<void>((resolve, reject) => {
    const onData = (chunk: Buffer) => {
      if (chunk.toString().includes('listening') || chunk.toString().includes('Backend')) {
        cleanup()
        resolve()
      }
    }
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error(`Server not ready in ${ms}ms`))
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

  try {
    await waitForServer(proc.stdout!, 15000)
  } catch (e) {
    proc.kill('SIGTERM')
    throw e
  }

  const base = `http://127.0.0.1:${port}`

  try {
    const g = await fetch(`${base}/api/transcribe-preview`)
    const gj = await g.json()
    console.log('[A] GET /api/transcribe-preview', g.status, gj)

    const fd = new FormData()
    const b = new Uint8Array(400).fill(3)
    fd.append('audio', new Blob([b], { type: 'audio/webm' }), 'preview.webm')
    const p = await fetch(`${base}/api/transcribe-preview`, { method: 'POST', body: fd })
    const pj = await p.json().catch(() => null)
    console.log('[B] POST dummy audio', p.status, pj)
    console.log('Transcribe-preview smoke OK.')
  } finally {
    proc.kill('SIGTERM')
    await once(proc, 'close').catch(() => {})
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
