import 'dotenv/config'
import express from 'express'

import { applySecurity } from './security'
import { abuseTracker, abuseAdminRouter } from './abuse-tracker'
import { rejectHoneypot, sanitizeContactInput } from './sanitize'
import { cacheRateLimit, cacheMiddleware, cacheAdminRouter } from './cache'
import { deviceIntel, deviceIntelAdminRouter } from './device-intel'
import { registerPipelineRoutes } from './index'
import { sendEmailHandler } from './handlers/sendEmailHandler'
import { transcribePreviewHandler } from './handlers/transcribePreviewHandler'
import { voiceNoteHandler, voiceUpload } from './handlers/voiceNoteHandler'

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