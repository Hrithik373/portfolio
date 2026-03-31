/**
 * Device Fingerprint Collector — runs in the browser
 * Place at: src/lib/fingerprint.ts
 *
 * Collects 20+ browser signals to build a device fingerprint
 * that stays the same even when the user changes VPN/IP.
 *
 * Usage in your form components:
 *   import { collectFingerprint } from '../../lib/fingerprint'
 *
 *   // In your form submit handler, add to the fetch body:
 *   const fp = await collectFingerprint()
 *   body: JSON.stringify({ name, email, subject, message, website, _fp: fp })
 */

/* ── Canvas fingerprint — renders text + shapes, hashes the pixel data ── */
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 280
    canvas.height = 60
    const ctx = canvas.getContext('2d')
    if (!ctx) return 'no-canvas'

    // Text rendering — different GPUs/OS/fonts produce different pixels
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillStyle = '#f60'
    ctx.fillRect(0, 0, 280, 60)
    ctx.fillStyle = '#069'
    ctx.fillText('Portfolio security fingerprint 🌸', 2, 15)
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
    ctx.fillText('Canvas fp v2', 4, 37)

    // Geometric shapes — GPU-dependent rendering
    ctx.beginPath()
    ctx.arc(50, 50, 10, 0, Math.PI * 2)
    ctx.closePath()
    ctx.fill()

    return canvas.toDataURL().slice(-64) // last 64 chars of data URL
  } catch {
    return 'canvas-error'
  }
}

/* ── WebGL fingerprint — GPU vendor + renderer string ── */
function getWebGLFingerprint(): { vendor: string; renderer: string; hash: string } {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl || !(gl instanceof WebGLRenderingContext)) {
      return { vendor: 'none', renderer: 'none', hash: 'no-webgl' }
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown'
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown'

    return { vendor, renderer, hash: simpleHash(`${vendor}|${renderer}`) }
  } catch {
    return { vendor: 'error', renderer: 'error', hash: 'webgl-error' }
  }
}

/* ── Audio fingerprint — AudioContext oscillator output varies by hardware ── */
async function getAudioFingerprint(): Promise<string> {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return 'no-audio'

    const ctx = new AudioCtx()
    const oscillator = ctx.createOscillator()
    const analyser = ctx.createAnalyser()
    const gain = ctx.createGain()
    const compressor = ctx.createDynamicsCompressor()

    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(10000, ctx.currentTime)

    compressor.threshold.setValueAtTime(-50, ctx.currentTime)
    compressor.knee.setValueAtTime(40, ctx.currentTime)
    compressor.ratio.setValueAtTime(12, ctx.currentTime)
    compressor.attack.setValueAtTime(0, ctx.currentTime)
    compressor.release.setValueAtTime(0.25, ctx.currentTime)

    oscillator.connect(compressor)
    compressor.connect(analyser)
    analyser.connect(gain)
    gain.gain.value = 0 // silent
    gain.connect(ctx.destination)

    oscillator.start(0)

    await new Promise((r) => setTimeout(r, 100))

    const data = new Float32Array(analyser.frequencyBinCount)
    analyser.getFloatFrequencyData(data)

    oscillator.stop()
    await ctx.close()

    // Sum a portion of the frequency data as fingerprint
    let sum = 0
    for (let i = 0; i < Math.min(data.length, 50); i++) {
      sum += Math.abs(data[i])
    }
    return sum.toFixed(4)
  } catch {
    return 'audio-error'
  }
}

/* ── Font detection — which system fonts are installed ── */
function getInstalledFonts(): string[] {
  const testFonts = [
    'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
    'Palatino', 'Garamond', 'Comic Sans MS', 'Impact', 'Trebuchet MS',
    'Arial Black', 'Lucida Console', 'Tahoma', 'Helvetica Neue',
    'Segoe UI', 'Roboto', 'Noto Sans', 'Fira Code', 'Consolas',
    'Menlo', 'Monaco', 'SF Pro', 'Apple Color Emoji', 'MS Gothic',
    'Yu Gothic', 'Meiryo', 'Malgun Gothic', 'Nirmala UI',
  ]

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return []

  const baseFonts = ['monospace', 'sans-serif', 'serif']
  const testString = 'mmmmmmmmmmlli'
  const testSize = '72px'

  // Measure base widths
  const baseWidths: Record<string, number> = {}
  for (const base of baseFonts) {
    ctx.font = `${testSize} ${base}`
    baseWidths[base] = ctx.measureText(testString).width
  }

  const detected: string[] = []
  for (const font of testFonts) {
    for (const base of baseFonts) {
      ctx.font = `${testSize} '${font}', ${base}`
      if (ctx.measureText(testString).width !== baseWidths[base]) {
        detected.push(font)
        break
      }
    }
  }

  return detected
}

/* ── Hardware signals ── */
function getHardwareSignals() {
  return {
    cores: navigator.hardwareConcurrency || 0,
    memory: (navigator as unknown as { deviceMemory?: number }).deviceMemory || 0,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    screenW: screen.width,
    screenH: screen.height,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio || 1,
    screenAvailW: screen.availWidth,
    screenAvailH: screen.availHeight,
  }
}

/* ── Timezone + locale signals ── */
function getTimezoneSignals() {
  const d = new Date()
  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: d.getTimezoneOffset(),
    locale: Intl.DateTimeFormat().resolvedOptions().locale,
    languages: Array.from(navigator.languages || [navigator.language]),
  }
}

/* ── Browser capability signals ── */
function getBrowserSignals() {
  return {
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack || (window as unknown as { doNotTrack?: string }).doNotTrack || '',
    platform: navigator.platform || '',
    vendor: navigator.vendor || '',
    pdfViewerEnabled: (navigator as unknown as { pdfViewerEnabled?: boolean }).pdfViewerEnabled ?? null,
    webdriver: !!(navigator as unknown as { webdriver?: boolean }).webdriver,
    plugins: Array.from(navigator.plugins || []).map((p) => p.name).slice(0, 10),
  }
}

/* ── WebRTC local IP leak detection (works even through some VPNs) ── */
async function getWebRTCLeaks(): Promise<string[]> {
  return new Promise((resolve) => {
    const ips: string[] = []
    try {
      const pc = new RTCPeerConnection({ iceServers: [] })
      pc.createDataChannel('')
      pc.createOffer().then((offer) => pc.setLocalDescription(offer))
      pc.onicecandidate = (e) => {
        if (!e.candidate) {
          pc.close()
          resolve([...new Set(ips)])
          return
        }
        const parts = e.candidate.candidate.split(' ')
        const ip = parts[4]
        if (ip && !ip.includes(':') && ip !== '0.0.0.0') {
          ips.push(ip)
        }
      }
      // Timeout after 3 seconds
      setTimeout(() => { pc.close(); resolve([...new Set(ips)]) }, 3000)
    } catch {
      resolve([])
    }
  })
}

/* ── Simple string hash ── */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36)
}

/* ── Stable hash for the full fingerprint ── */
function stableHash(obj: Record<string, unknown>): string {
  const str = JSON.stringify(obj, Object.keys(obj).sort())
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

/* ════════════════════════════════════════
 * MAIN: Collect all signals into one fingerprint
 * ════════════════════════════════════════ */
export interface DeviceFingerprint {
  /** Stable device ID — same across VPN/IP changes */
  deviceId: string
  /** Canvas rendering hash */
  canvas: string
  /** WebGL GPU info */
  webgl: { vendor: string; renderer: string; hash: string }
  /** Audio processing hash */
  audio: string
  /** Detected fonts count + hash */
  fonts: { count: number; hash: string }
  /** Hardware: cores, memory, screen, touch */
  hardware: ReturnType<typeof getHardwareSignals>
  /** Timezone + locale */
  timezone: ReturnType<typeof getTimezoneSignals>
  /** Browser capabilities */
  browser: ReturnType<typeof getBrowserSignals>
  /** WebRTC leaked local IPs (may reveal real IP behind VPN) */
  webrtcIPs: string[]
  /** Collection timestamp */
  collectedAt: string
}

export async function collectFingerprint(): Promise<DeviceFingerprint> {
  const canvas = getCanvasFingerprint()
  const webgl = getWebGLFingerprint()
  const audio = await getAudioFingerprint()
  const fonts = getInstalledFonts()
  const hardware = getHardwareSignals()
  const timezone = getTimezoneSignals()
  const browser = getBrowserSignals()
  const webrtcIPs = await getWebRTCLeaks()

  const fontsHash = simpleHash(fonts.join(','))

  // Build stable device ID from the most hardware-bound signals
  const deviceId = stableHash({
    canvas,
    webglHash: webgl.hash,
    audio,
    fontsHash,
    cores: hardware.cores,
    memory: hardware.memory,
    screenW: hardware.screenW,
    screenH: hardware.screenH,
    colorDepth: hardware.colorDepth,
    pixelRatio: hardware.pixelRatio,
    timezone: timezone.timezone,
    platform: browser.platform,
  })

  return {
    deviceId,
    canvas,
    webgl,
    audio,
    fonts: { count: fonts.length, hash: fontsHash },
    hardware,
    timezone,
    browser,
    webrtcIPs,
    collectedAt: new Date().toISOString(),
  }
}
