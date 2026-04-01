/**
 * Device Correlation Engine — backend module
 * Place at: backend/device-intel.ts
 *
 * Processes browser fingerprints sent from the frontend,
 * builds persistent device profiles, detects VPN/proxy usage,
 * and correlates multiple IPs to the same physical device.
 *
 * Supports both JSON body (_fp as object) and multipart form data (_fp as string).
 *
 * Blocking: Admin can hardware-block a device via dashboard.
 * Blocked devices get 403 on ALL form submissions regardless of IP.
 *
 * Usage in backend/server.ts:
 *   import { deviceIntel, deviceIntelAdminRouter } from './device-intel'
 *
 *   app.post('/api/send-email', cacheRateLimit, deviceIntel, abuseTracker, ...)
 *   app.post('/api/voice-note', voiceUpload.single('audio'), cacheRateLimit, deviceIntel, abuseTracker, ...)
 *   app.use('/api/admin/devices', deviceIntelAdminRouter)
 */

import { Router, type Request, type Response, type NextFunction } from 'express'
import { loadData, saveData } from './redis-store'

/* ── Config ── */
const ADMIN_PASSWORD = process.env.ABUSE_ADMIN_PASSWORD || 'changeme-in-env'

/* ── Known VPN/Datacenter ASN patterns ── */
const VPN_INDICATORS = {
  /** Known VPN provider IP ranges (partial — extend as needed) */
  datacenterASNKeywords: [
    'digitalocean', 'linode', 'vultr', 'hetzner', 'ovh', 'amazonaws',
    'google cloud', 'microsoft azure', 'oracle cloud', 'cloudflare',
    'mullvad', 'nordvpn', 'expressvpn', 'surfshark', 'protonvpn',
    'cyberghost', 'private internet access', 'ipvanish', 'windscribe',
  ],
  /** Suspicious reverse DNS patterns */
  suspiciousRDNS: [
    /^(vps|server|cloud|node|host|dedicated|proxy|vpn|tor)/i,
    /\.(compute|cloud|vps|hosting)\./i,
  ],
  /** Known Tor exit node user agents */
  torIndicators: ['tor browser', 'torbrowser'],
}

/* ── Types ── */
interface DeviceFP {
  deviceId: string
  canvas: string
  webgl: { vendor: string; renderer: string; hash: string }
  audio: string
  fonts: { count: number; hash: string }
  hardware: {
    cores: number; memory: number; maxTouchPoints: number
    screenW: number; screenH: number; colorDepth: number
    pixelRatio: number; screenAvailW: number; screenAvailH: number
  }
  timezone: {
    timezone: string; timezoneOffset: number
    locale: string; languages: string[]
  }
  browser: {
    cookieEnabled: boolean; doNotTrack: string; platform: string
    vendor: string; pdfViewerEnabled: boolean | null
    webdriver: boolean; plugins: string[]
  }
  webrtcIPs: string[]
  collectedAt: string
}

interface DeviceProfile {
  deviceId: string
  /** All IPs ever seen from this device */
  knownIPs: string[]
  /** WebRTC leaked IPs (potential real IPs behind VPN) */
  leakedIPs: string[]
  /** All emails submitted from this device */
  emails: string[]
  /** All User-Agent strings seen */
  userAgents: string[]
  /** Timezone info */
  timezone: string
  timezoneOffset: number
  /** Hardware signature */
  hardwareSignature: string
  /** Canvas + WebGL + Audio hashes */
  renderSignature: string
  /** GPU info */
  gpu: { vendor: string; renderer: string }
  /** Screen resolution */
  screen: string
  /** Font hash */
  fontsHash: string
  /** Number of sightings */
  sightings: number
  /** VPN detection signals */
  vpnDetected: boolean
  vpnSignals: string[]
  /** Threat score 0-100 */
  threatScore: number
  /** Timestamps */
  firstSeen: string
  lastSeen: string
  /** Track which features this device uses */
  features: {
    contactForm: number
    voiceNote: number
    newsletter: number
    transcribe: number
  }
  /** Detailed sighting log */
  sightingLog: Array<{
    time: string
    ip: string
    email: string
    endpoint: string
    vpnSignals: string[]
    /** Type of submission */
    type: 'contact' | 'voice' | 'newsletter' | 'transcribe' | 'unknown'
    /** Audio file size in bytes (voice notes only) */
    audioSize?: number
  }>
}

interface DeviceStore {
  devices: Record<string, DeviceProfile>
  /** deviceId → IPs mapping for quick lookup */
  deviceToIPs: Record<string, string[]>
  /** IP → deviceIds mapping for reverse lookup */
  ipToDevices: Record<string, string[]>
  /** WebRTC leaked IP → deviceIds */
  leakedIPToDevices: Record<string, string[]>
  /** Voice note abuse stats */
  voiceNoteStats: {
    totalSubmissions: number
    uniqueDevices: number
    uniqueIPs: number
    blockedAttempts: number
    deviceIds: string[]
  }
  /** Admin-blocked device IDs — these get 403 on all form submissions */
  blockedDevices: string[]
  totalDevices: number
  totalSightings: number
  lastUpdated: string
}

/* ── Persistence ── */
const EMPTY_DEVICE_STORE: DeviceStore = {
  devices: {}, deviceToIPs: {}, ipToDevices: {},
  leakedIPToDevices: {},
  voiceNoteStats: { totalSubmissions: 0, uniqueDevices: 0, uniqueIPs: 0, blockedAttempts: 0, deviceIds: [] },
  blockedDevices: [],
  totalDevices: 0, totalSightings: 0,
  lastUpdated: new Date().toISOString(),
}

function saveDeviceStore(s: DeviceStore): void {
  s.lastUpdated = new Date().toISOString()
  for (const d of Object.values(s.devices)) {
    if (d.sightingLog.length > 200) d.sightingLog = d.sightingLog.slice(-200)
  }
  void saveData('device-intel', s)
}

const deviceStore: DeviceStore = { ...EMPTY_DEVICE_STORE }

void loadData<DeviceStore>('device-intel', EMPTY_DEVICE_STORE).then((s) => {
  if (!s.voiceNoteStats) s.voiceNoteStats = { totalSubmissions: 0, uniqueDevices: 0, uniqueIPs: 0, blockedAttempts: 0, deviceIds: [] }
  if (!s.blockedDevices) s.blockedDevices = []
  Object.assign(deviceStore, s)
  console.log('[DeviceIntel] Store loaded from Redis')
})

setInterval(() => saveDeviceStore(deviceStore), 5 * 60 * 1000)

/* ── Parse _fp from either JSON body or multipart string field ── */
function extractFingerprint(req: Request): DeviceFP | null {
  const raw = req.body?._fp
  if (!raw) return null

  // JSON body — _fp is already an object
  if (typeof raw === 'object' && raw.deviceId) return raw as DeviceFP

  // Multipart form — multer gives _fp as a string
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as DeviceFP
      if (parsed.deviceId) return parsed
    } catch {
      console.warn('[DeviceIntel] Failed to parse _fp string from multipart body')
    }
  }

  return null
}

/* ── Detect submission type from endpoint ── */
function detectSubmissionType(endpoint: string, formType?: string): 'contact' | 'voice' | 'newsletter' | 'transcribe' | 'unknown' {
  if (endpoint.includes('voice-note')) return 'voice'
  if (endpoint.includes('transcribe')) return 'transcribe'
  if (formType === 'newsletter_signup') return 'newsletter'
  if (endpoint.includes('send-email')) return 'contact'
  return 'unknown'
}

/* ── VPN Detection Logic ── */
function detectVPNSignals(ip: string, fp: DeviceFP, ua: string): string[] {
  const signals: string[] = []

  /* 1. WebRTC leak — if leaked IPs don't match the request IP, VPN is likely */
  if (fp.webrtcIPs && fp.webrtcIPs.length > 0) {
    const leakedNonLocal = fp.webrtcIPs.filter(
      (lip) => !lip.startsWith('192.168.') && !lip.startsWith('10.') && !lip.startsWith('172.')
    )
    if (leakedNonLocal.length > 0 && !leakedNonLocal.includes(ip)) {
      signals.push(`webrtc_leak:real_ip_mismatch:${leakedNonLocal.join(',')}`)
    }
  }

  /* 2. Timezone vs IP geolocation mismatch */
  if (fp.timezone?.timezone) {
    const existingDevice = deviceStore.devices[fp.deviceId]
    if (existingDevice && existingDevice.timezone && existingDevice.timezone !== fp.timezone.timezone) {
      signals.push(`timezone_changed:${existingDevice.timezone}->${fp.timezone.timezone}`)
    }
  }

  /* 3. WebDriver detected — headless browser / automation */
  if (fp.browser?.webdriver) {
    signals.push('webdriver_detected:automated_browser')
  }

  /* 4. Tor browser detection */
  const uaLower = ua.toLowerCase()
  if (VPN_INDICATORS.torIndicators.some((t) => uaLower.includes(t))) {
    signals.push('tor_browser_detected')
  }

  /* 5. Canvas/WebGL blocked — privacy browser or VPN with fingerprint protection */
  if (fp.canvas === 'no-canvas' || fp.canvas === 'canvas-error') {
    signals.push('canvas_blocked:privacy_tool')
  }
  if (fp.webgl?.hash === 'no-webgl' || fp.webgl?.hash === 'webgl-error') {
    signals.push('webgl_blocked:privacy_tool')
  }

  /* 6. Hardware anomaly — too few cores or no memory info (VM/container) */
  if (fp.hardware?.cores === 1 || fp.hardware?.cores === 2) {
    signals.push(`low_core_count:${fp.hardware.cores}:possible_vm`)
  }
  if (fp.hardware?.memory === 0) {
    signals.push('memory_hidden:privacy_setting')
  }

  /* 7. Do-Not-Track enabled — correlates with privacy-conscious users */
  if (fp.browser?.doNotTrack === '1') {
    signals.push('dnt_enabled')
  }

  /* 8. Multiple IPs from same device — strongest VPN indicator */
  const existingIPs = deviceStore.deviceToIPs[fp.deviceId] || []
  if (existingIPs.length > 0 && !existingIPs.includes(ip)) {
    signals.push(`multi_ip:${existingIPs.length + 1}_ips_same_device`)

    // If IPs are in wildly different ranges, very likely VPN
    const existingOctets = existingIPs.map((eip) => eip.split('.')[0])
    const currentOctet = ip.split('.')[0]
    if (!existingOctets.includes(currentOctet)) {
      signals.push(`ip_range_jump:${existingOctets[0]}.x.x.x->${currentOctet}.x.x.x`)
    }
  }

  return signals
}

/* ── Threat Score Calculator ── */
function calculateThreatScore(profile: DeviceProfile, newSignals: string[]): number {
  let score = 0

  // Base signals
  if (profile.vpnDetected) score += 15
  if (newSignals.some((s) => s.startsWith('webrtc_leak'))) score += 25
  if (newSignals.some((s) => s.startsWith('tor_browser'))) score += 30
  if (newSignals.some((s) => s.startsWith('webdriver'))) score += 35
  if (newSignals.some((s) => s.startsWith('multi_ip'))) score += 20
  if (newSignals.some((s) => s.startsWith('ip_range_jump'))) score += 15
  if (newSignals.some((s) => s.startsWith('timezone_changed'))) score += 10
  if (newSignals.some((s) => s.includes('privacy_tool'))) score += 10
  if (newSignals.some((s) => s.includes('possible_vm'))) score += 10

  // Behavioral multipliers
  if (profile.knownIPs.length > 5) score += 15  // 5+ different IPs
  if (profile.emails.length > 3) score += 20     // 3+ different emails
  if (profile.sightings > 20) score += 10        // heavy usage

  // Voice note abuse — extra weight
  if (profile.features.voiceNote > 5) score += 15   // 5+ voice notes = suspicious
  if (profile.features.voiceNote > 10) score += 20  // 10+ = very suspicious

  // Rapid IP switching (3+ IPs in last 10 sightings)
  const recentIPs = new Set(profile.sightingLog.slice(-10).map((s) => s.ip))
  if (recentIPs.size >= 3) score += 20

  return Math.min(100, score)
}

/* ── Build hardware + render signatures ── */
function buildHardwareSignature(hw: DeviceFP['hardware']): string {
  return `${hw.cores}c|${hw.memory}gb|${hw.screenW}x${hw.screenH}|${hw.colorDepth}bit|${hw.pixelRatio}x|${hw.maxTouchPoints}t`
}

function buildRenderSignature(fp: DeviceFP): string {
  return `${fp.canvas}|${fp.webgl?.hash || 'none'}|${fp.audio}`
}

/* ── Main Middleware ── */
export function deviceIntel(req: Request, res: Response, next: NextFunction): void {
  try {
    const fp = extractFingerprint(req)
    if (!fp || !fp.deviceId) {
      // No fingerprint sent — still proceed (don't break the form)
      next()
      return
    }

    /* ── Hardware block check (admin-initiated only) ── */
    if (deviceStore.blockedDevices.includes(fp.deviceId)) {
      console.warn(`[DeviceIntel] 🚫 HARDWARE BLOCKED device attempted submission: ${fp.deviceId.slice(0, 12)}...`)
      res.status(403).json({ error: 'This device has been blocked.' })
      return
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown'
    const email = String(req.body?.email || '').trim().toLowerCase()
    const endpoint = req.path
    const ua = req.headers['user-agent'] || ''
    const now = new Date().toISOString()
    const formType = req.body?.formType as string | undefined
    const submissionType = detectSubmissionType(endpoint, formType)

    // Get audio file size if present (multer attaches file to req)
    const audioSize = (req as Request & { file?: { size?: number } }).file?.size

    // Detect VPN signals
    const vpnSignals = detectVPNSignals(ip, fp, ua)
    const vpnDetected = vpnSignals.length > 0

    // Get or create device profile
    if (!deviceStore.devices[fp.deviceId]) {
      deviceStore.devices[fp.deviceId] = {
        deviceId: fp.deviceId,
        knownIPs: [],
        leakedIPs: [],
        emails: [],
        userAgents: [],
        timezone: fp.timezone?.timezone || '',
        timezoneOffset: fp.timezone?.timezoneOffset || 0,
        hardwareSignature: buildHardwareSignature(fp.hardware),
        renderSignature: buildRenderSignature(fp),
        gpu: { vendor: fp.webgl?.vendor || '', renderer: fp.webgl?.renderer || '' },
        screen: `${fp.hardware?.screenW}x${fp.hardware?.screenH}`,
        fontsHash: fp.fonts?.hash || '',
        sightings: 0,
        vpnDetected: false,
        vpnSignals: [],
        threatScore: 0,
        features: { contactForm: 0, voiceNote: 0, newsletter: 0, transcribe: 0 },
        firstSeen: now,
        lastSeen: now,
        sightingLog: [],
      }
      deviceStore.totalDevices++
    }

    const profile = deviceStore.devices[fp.deviceId]
    profile.lastSeen = now
    profile.sightings++
    deviceStore.totalSightings++

    // Ensure features object exists (for older profiles)
    if (!profile.features) {
      profile.features = { contactForm: 0, voiceNote: 0, newsletter: 0, transcribe: 0 }
    }

    // Track feature usage
    if (submissionType === 'contact') profile.features.contactForm++
    if (submissionType === 'voice') profile.features.voiceNote++
    if (submissionType === 'newsletter') profile.features.newsletter++
    if (submissionType === 'transcribe') profile.features.transcribe++

    // Track IPs
    if (!profile.knownIPs.includes(ip)) profile.knownIPs.push(ip)

    // Track WebRTC leaked IPs
    if (fp.webrtcIPs) {
      for (const lip of fp.webrtcIPs) {
        if (!profile.leakedIPs.includes(lip)) profile.leakedIPs.push(lip)
        // Map leaked IP → device
        if (!deviceStore.leakedIPToDevices[lip]) deviceStore.leakedIPToDevices[lip] = []
        if (!deviceStore.leakedIPToDevices[lip].includes(fp.deviceId)) {
          deviceStore.leakedIPToDevices[lip].push(fp.deviceId)
        }
      }
    }

    // Track emails
    if (email && !profile.emails.includes(email)) profile.emails.push(email)

    // Track user agents (last 5)
    if (ua && !profile.userAgents.includes(ua)) {
      profile.userAgents.push(ua)
      if (profile.userAgents.length > 5) profile.userAgents.shift()
    }

    // Update VPN status
    if (vpnDetected) {
      profile.vpnDetected = true
      for (const sig of vpnSignals) {
        if (!profile.vpnSignals.includes(sig)) profile.vpnSignals.push(sig)
      }
    }

    // Log sighting with type and audio size
    profile.sightingLog.push({
      time: now, ip, email, endpoint, vpnSignals,
      type: submissionType,
      audioSize: audioSize || undefined,
    })

    // Calculate threat score
    profile.threatScore = calculateThreatScore(profile, vpnSignals)

    // Update IP ↔ device mappings
    if (!deviceStore.deviceToIPs[fp.deviceId]) deviceStore.deviceToIPs[fp.deviceId] = []
    if (!deviceStore.deviceToIPs[fp.deviceId].includes(ip)) {
      deviceStore.deviceToIPs[fp.deviceId].push(ip)
    }
    if (!deviceStore.ipToDevices[ip]) deviceStore.ipToDevices[ip] = []
    if (!deviceStore.ipToDevices[ip].includes(fp.deviceId)) {
      deviceStore.ipToDevices[ip].push(fp.deviceId)
    }

    // Update voice note stats
    if (submissionType === 'voice') {
      deviceStore.voiceNoteStats.totalSubmissions++
      if (!deviceStore.voiceNoteStats.deviceIds.includes(fp.deviceId)) {
        deviceStore.voiceNoteStats.deviceIds.push(fp.deviceId)
        deviceStore.voiceNoteStats.uniqueDevices++
      }
      // Count unique IPs for voice notes
      const voiceIPs = new Set<string>()
      for (const d of Object.values(deviceStore.devices)) {
        for (const log of d.sightingLog) {
          if (log.type === 'voice') voiceIPs.add(log.ip)
        }
      }
      deviceStore.voiceNoteStats.uniqueIPs = voiceIPs.size
    }

    // Log
    const threatEmoji = profile.threatScore >= 60 ? '🔴' : profile.threatScore >= 30 ? '🟡' : '🟢'
    const typeEmoji = submissionType === 'voice' ? '🎙️' : submissionType === 'newsletter' ? '📧' : submissionType === 'transcribe' ? '📝' : '✉️'
    console.log(
      `[DeviceIntel] ${threatEmoji}${typeEmoji} Device: ${fp.deviceId.slice(0, 12)}... | IP: ${ip} | ` +
      `Type: ${submissionType} | IPs: ${profile.knownIPs.length} | Threat: ${profile.threatScore}/100 | ` +
      `VPN: ${vpnDetected ? 'YES' : 'no'} | Voice: ${profile.features.voiceNote} | Sightings: ${profile.sightings}`
    )

    if (vpnSignals.length > 0) {
      console.warn(`[DeviceIntel] VPN signals: ${vpnSignals.join(', ')}`)
    }

    if (submissionType === 'voice' && audioSize) {
      console.log(`[DeviceIntel] 🎙️ Audio upload: ${(audioSize / 1024).toFixed(1)}KB from device ${fp.deviceId.slice(0, 12)}...`)
    }

    // Attach to request for downstream middleware (abuse-tracker can use this)
    ;(req as Request & { _deviceProfile?: DeviceProfile })._deviceProfile = profile

    // Remove _fp from body before it reaches the handler
    delete req.body._fp
  } catch (err) {
    console.error('[DeviceIntel] Error processing fingerprint:', err)
  }

  next()
}

/* ── Admin API ── */
export const deviceIntelAdminRouter = Router()

function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization
  if (!auth || auth !== `Bearer ${ADMIN_PASSWORD}`) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}

deviceIntelAdminRouter.use(adminAuth)

/* GET /api/admin/devices — full device intel report */
deviceIntelAdminRouter.get('/', (_req: Request, res: Response) => {
  const allDevices = Object.values(deviceStore.devices)
    .sort((a, b) => b.threatScore - a.threatScore)

  const highThreat = allDevices.filter((d) => d.threatScore >= 60)
  const vpnUsers = allDevices.filter((d) => d.vpnDetected)
  const multiIP = allDevices.filter((d) => d.knownIPs.length > 2)
  const voiceAbusers = allDevices.filter((d) => d.features && d.features.voiceNote > 5)

  res.json({
    summary: {
      totalDevices: deviceStore.totalDevices,
      totalSightings: deviceStore.totalSightings,
      highThreatDevices: highThreat.length,
      vpnDetected: vpnUsers.length,
      multiIPDevices: multiIP.length,
      voiceNoteAbusers: voiceAbusers.length,
      blockedDevices: deviceStore.blockedDevices.length,
      lastUpdated: deviceStore.lastUpdated,
    },
    voiceNoteStats: deviceStore.voiceNoteStats,
    blockedDevices: deviceStore.blockedDevices,
    highThreat: highThreat.map(summarizeDevice),
    vpnUsers: vpnUsers.map(summarizeDevice),
    voiceAbusers: voiceAbusers.map(summarizeDevice),
    allDevices: allDevices.slice(0, 50).map(summarizeDevice),
  })
})

/* GET /api/admin/devices/voice — voice note specific report */
deviceIntelAdminRouter.get('/voice', (_req: Request, res: Response) => {
  const allDevices = Object.values(deviceStore.devices)
  const voiceDevices = allDevices
    .filter((d) => d.features && d.features.voiceNote > 0)
    .sort((a, b) => b.features.voiceNote - a.features.voiceNote)

  const voiceLogs: Array<{
    time: string; ip: string; email: string; deviceId: string
    audioSize?: number; vpnSignals: string[]; threatScore: number
  }> = []

  for (const d of voiceDevices) {
    for (const log of d.sightingLog) {
      if (log.type === 'voice') {
        voiceLogs.push({
          time: log.time, ip: log.ip, email: log.email,
          deviceId: d.deviceId, audioSize: log.audioSize,
          vpnSignals: log.vpnSignals, threatScore: d.threatScore,
        })
      }
    }
  }

  voiceLogs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  res.json({
    stats: deviceStore.voiceNoteStats,
    devices: voiceDevices.map(summarizeDevice),
    recentVoiceLogs: voiceLogs.slice(0, 50),
  })
})

/* POST /api/admin/devices/block-device — hardware block a device (admin only) */
deviceIntelAdminRouter.post('/block-device', (req: Request, res: Response) => {
  const { deviceId } = req.body as { deviceId?: string }
  if (!deviceId) {
    res.status(400).json({ error: 'deviceId required.' })
    return
  }
  if (!deviceStore.blockedDevices.includes(deviceId)) {
    deviceStore.blockedDevices.push(deviceId)
  }
  saveDeviceStore(deviceStore)
  console.warn(`[DeviceIntel] 🚫 HARDWARE BLOCKED by admin: ${deviceId.slice(0, 16)}...`)
  res.json({ success: true, deviceId, blocked: true })
})

/* POST /api/admin/devices/unblock-device — remove hardware block (admin only) */
deviceIntelAdminRouter.post('/unblock-device', (req: Request, res: Response) => {
  const { deviceId } = req.body as { deviceId?: string }
  if (!deviceId) {
    res.status(400).json({ error: 'deviceId required.' })
    return
  }
  deviceStore.blockedDevices = deviceStore.blockedDevices.filter((id: string) => id !== deviceId)
  saveDeviceStore(deviceStore)
  console.log(`[DeviceIntel] ✅ Hardware unblocked by admin: ${deviceId.slice(0, 16)}...`)
  res.json({ success: true, deviceId, blocked: false })
})

/* GET /api/admin/devices/:deviceId — full device profile (MUST BE LAST — catches all params) */
deviceIntelAdminRouter.get('/:deviceId', (req: Request, res: Response) => {
  const profile = deviceStore.devices[req.params.deviceId as string]
  if (!profile) {
    res.status(404).json({ error: 'Device not found.' })
    return
  }

  // Find all other devices from the same IPs
  const relatedDeviceIds = new Set<string>()
  for (const ip of profile.knownIPs) {
    const devices = deviceStore.ipToDevices[ip] || []
    for (const did of devices) {
      if (did !== profile.deviceId) relatedDeviceIds.add(did)
    }
  }
  // Also check leaked IPs
  for (const lip of profile.leakedIPs) {
    const devices = deviceStore.leakedIPToDevices[lip] || []
    for (const did of devices) {
      if (did !== profile.deviceId) relatedDeviceIds.add(did)
    }
  }

  const relatedDevices = Array.from(relatedDeviceIds)
    .map((did: string) => deviceStore.devices[did])
    .filter(Boolean)
    .map(summarizeDevice)

  res.json({
    ...profile,
    hardwareBlocked: deviceStore.blockedDevices.includes(profile.deviceId),
    relatedDevices,
  })
})

/* GET /api/admin/devices/lookup/ip/:ip — find all devices from an IP */
deviceIntelAdminRouter.get('/lookup/ip/:ip', (req: Request, res: Response) => {
  const ip = req.params.ip as string
  const deviceIds: string[] = deviceStore.ipToDevices[ip as string] || []
  const devices = deviceIds.map((did: string) => deviceStore.devices[did]).filter(Boolean)

  // Also check if this IP was leaked via WebRTC
  const leakedDeviceIds: string[] = deviceStore.leakedIPToDevices[ip as string] || []
  const leakedDevices = leakedDeviceIds.map((did: string) => deviceStore.devices[did]).filter(Boolean)

  res.json({
    ip,
    directDevices: devices.map(summarizeDevice),
    webrtcLeakDevices: leakedDevices.map(summarizeDevice),
    totalDevices: new Set([...deviceIds, ...leakedDeviceIds]).size,
  })
})

function summarizeDevice(d: DeviceProfile) {
  return {
    deviceId: d.deviceId,
    knownIPs: d.knownIPs,
    leakedIPs: d.leakedIPs,
    emails: d.emails,
    gpu: d.gpu,
    screen: d.screen,
    timezone: d.timezone,
    hardwareSignature: d.hardwareSignature,
    sightings: d.sightings,
    vpnDetected: d.vpnDetected,
    vpnSignals: d.vpnSignals,
    threatScore: d.threatScore,
    features: d.features || { contactForm: 0, voiceNote: 0, newsletter: 0, transcribe: 0 },
    hardwareBlocked: deviceStore.blockedDevices.includes(d.deviceId),
    firstSeen: d.firstSeen,
    lastSeen: d.lastSeen,
    recentLog: d.sightingLog.slice(-5),
  }
}