import 'dotenv/config'
import express from 'express'
import { loadData, saveData } from './redis-store'

import { applySecurity } from './security'
import { abuseTracker, abuseAdminRouter } from './abuse-tracker'
import { rejectHoneypot, sanitizeContactInput } from './sanitize'
import { cacheRateLimit, cacheMiddleware, cacheAdminRouter } from './cache'
import { deviceIntel, deviceIntelAdminRouter } from './device-intel'
import { registerPipelineRoutes } from './index'
import { sendEmailHandler } from './handlers/sendEmailHandler'
import { transcribePreviewHandler } from './handlers/transcribePreviewHandler'
import { voiceNoteHandler, voiceUpload } from './handlers/voiceNoteHandler'
import { getPlaylistData } from './services/spotify-service'

const app = express()
applySecurity(app)
const port = Number(process.env.PORT || 8787)

/* ── Health check — mount FIRST ── */
app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

/* ── Admin dashboards — mount BEFORE any catch-all or pipeline routes ── */
app.use('/api/admin', abuseAdminRouter)
app.use('/api/admin/cache', cacheAdminRouter)
app.use('/api/admin/devices', deviceIntelAdminRouter)

type VisitorRecord = {
  ip: string
  userAgent: string
  page: string
  referrer: string
  url: string
  screenWidth: number
  screenHeight: number
  language: string
  timestamp: string
  fingerprint: { deviceId?: string; webgl?: { renderer?: string }; timezone?: { timezone?: string }; hardware?: { cores?: number; memory?: number } } | null
}

type DeviceEntry = {
  deviceId: string | null
  ip: string
  ips: string[]
  userAgent: string
  gpu: string
  screen: string
  language: string
  timezone: string
  hardware: string
  pages: { page: string; url: string; referrer: string; time: string }[]
  visits: number
  firstSeen: string
  lastSeen: string
}

/* ── Visitor tracking — no auth, silent fail ── */
app.post('/api/visitor', express.json({ limit: '10kb' }), (req, res) => {
  try {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown'
    const ua = req.headers['user-agent'] ?? ''
    const { _fp, page, referrer, url, screenWidth, screenHeight, language, timestamp } = req.body as {
      _fp?: VisitorRecord['fingerprint']
      page?: string
      referrer?: string
      url?: string
      screenWidth?: number
      screenHeight?: number
      language?: string
      timestamp?: string
    }

    const record: VisitorRecord = {
      ip,
      userAgent: ua,
      page: page ?? 'unknown',
      referrer: referrer ?? 'direct',
      url: url ?? '',
      screenWidth: screenWidth ?? 0,
      screenHeight: screenHeight ?? 0,
      language: language ?? '',
      timestamp: timestamp ?? new Date().toISOString(),
      fingerprint: _fp ?? null,
    }

    void (async () => {
      try {
        let visitors = await loadData<VisitorRecord[]>('visitors', [])
        visitors.push(record)
        if (visitors.length > 1000) visitors = visitors.slice(-1000)
        await saveData('visitors', visitors)
      } catch (err) {
        console.error('[Visitor] Save error:', err)
      }
    })()

    console.log(`[Visitor] ${record.page} | IP: ${ip} | Device: ${record.fingerprint?.deviceId?.slice(0, 12) ?? 'no-fp'}... | ${ua.slice(0, 50)}`)
    res.json({ ok: true })
  } catch (err) {
    console.error('[Visitor] Error:', err)
    res.json({ ok: true })
  }
})

/* ── Visitor admin — requires Bearer auth ── */
app.get('/api/admin/visitors', async (req, res) => {
  const auth = req.headers.authorization
  const ADMIN_PASSWORD = process.env.ABUSE_ADMIN_PASSWORD ?? 'changeme-in-env'
  if (!auth || auth !== `Bearer ${ADMIN_PASSWORD}`) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const visitors = await loadData<VisitorRecord[]>('visitors', [])
  const uniqueIPs = new Set(visitors.map((v) => v.ip))
  const uniqueDevices = new Set(visitors.filter((v) => v.fingerprint?.deviceId).map((v) => v.fingerprint!.deviceId))
  const desktopCount = visitors.filter((v) => v.page === 'desktop').length
  const mobileCount = visitors.filter((v) => v.page === 'mobile').length

  const deviceMap: Record<string, DeviceEntry> = {}
  for (const v of visitors) {
    const did = v.fingerprint?.deviceId ?? `ip_${v.ip}`
    if (!deviceMap[did]) {
      deviceMap[did] = {
        deviceId: v.fingerprint?.deviceId ?? null,
        ip: v.ip,
        ips: [v.ip],
        userAgent: v.userAgent,
        gpu: v.fingerprint?.webgl?.renderer ?? 'unknown',
        screen: `${v.screenWidth}x${v.screenHeight}`,
        language: v.language,
        timezone: v.fingerprint?.timezone?.timezone ?? 'unknown',
        hardware: v.fingerprint?.hardware
          ? `${v.fingerprint.hardware.cores ?? '?'}c|${v.fingerprint.hardware.memory ?? '?'}gb`
          : 'unknown',
        pages: [],
        visits: 0,
        firstSeen: v.timestamp,
        lastSeen: v.timestamp,
      }
    }
    const d = deviceMap[did]
    d.visits++
    d.lastSeen = v.timestamp
    if (!d.ips.includes(v.ip)) d.ips.push(v.ip)
    d.pages.push({ page: v.page, url: v.url, referrer: v.referrer, time: v.timestamp })
    if (d.pages.length > 20) d.pages = d.pages.slice(-20)
  }

  res.json({
    summary: {
      totalVisits: visitors.length,
      uniqueIPs: uniqueIPs.size,
      uniqueDevices: uniqueDevices.size,
      desktopVisits: desktopCount,
      mobileVisits: mobileCount,
    },
    devices: Object.values(deviceMap).sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()),
    recentVisitors: visitors.slice(-30).reverse(),
  })
})

/* ── Cache middleware — tracks IP reputation on every request ── */
app.use(cacheMiddleware)

/* ── Sanitize + validate contact input middleware ── */
function validateContact(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  const formType = req.body?.formType as string | undefined
  if (formType && formType !== 'contact') {
    next()
    return
  }

  const result = sanitizeContactInput(req.body as Record<string, unknown>)
  if (!result.ok) {
    res.status(400).json({ error: result.error })
    return
  }
  req.body = { ...req.body, ...result.data }
  next()
}

/* ── Contact email — full security chain ── */
app.post('/api/send-email', cacheRateLimit, deviceIntel, abuseTracker, rejectHoneypot, validateContact, (req, res) => {
  void sendEmailHandler(req, res)
})

/* ── Voice note capability pings ── */
app.get('/api/voice-note', (_req, res) => {
  res.json({ ok: true, accepts: 'POST multipart: email, warmNote?, audio' })
})

app.get('/api/transcribe-preview', (_req, res) => {
  res.json({ ok: true, accepts: 'POST multipart field: audio' })
})

/* ── Voice note upload — with device intel + abuse tracking + cache rate limit ── */
app.post('/api/voice-note', voiceUpload.single('audio'), cacheRateLimit, deviceIntel, abuseTracker, (req, res) => {
  void voiceNoteHandler(req, res)
})

app.post('/api/transcribe-preview', voiceUpload.single('audio'), (req, res) => {
  void transcribePreviewHandler(req, res)
})

/* ── Spotify playlist — public, cached 5 min ── */
const spotifyCache: { data: unknown; expiresAt: number } = { data: null, expiresAt: 0 }
app.get('/api/spotify/playlist', (_req, res) => {
  const playlistId = process.env.SPOTIFY_PLAYLIST_ID
  if (!playlistId) {
    res.status(503).json({ error: 'SPOTIFY_PLAYLIST_ID not configured' })
    return
  }
  if (spotifyCache.data && Date.now() < spotifyCache.expiresAt) {
    res.json(spotifyCache.data)
    return
  }
  void getPlaylistData(playlistId).then((data) => {
    spotifyCache.data = data
    spotifyCache.expiresAt = Date.now() + 5 * 60 * 1000
    res.json(data)
  }).catch((err: unknown) => {
    console.error('[Spotify]', err)
    res.status(502).json({ error: 'Failed to fetch playlist from Spotify' })
  })
})

/* ── Pipeline routes LAST — won't override routes above ── */
registerPipelineRoutes(app)

/* ── Error handler ── */
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    next: (err?: unknown) => void,
  ) => {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code: string }).code)
        : ''
    if (code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Audio file is too large (max 8 MB).' })
    }
    next(err)
  },
)

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})