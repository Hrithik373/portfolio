/**
 * Email Abuse Tracker — catches spam senders and logs their IP
 *
 * Features:
 *  1. Logs every email/newsletter attempt: IP, email, timestamp, user-agent, geo
 *  2. Detects repeat offenders by IP and by email address
 *  3. Auto-escalation: warn (3) → throttle (5) → block (8) → permanent ban (15) → hard block (100)
 *  4. Exposes /api/admin/abuse endpoint to view all flagged IPs (password protected)
 *  5. Persists abuse log to disk so it survives Render restarts
 *  6. Fingerprints requests (IP + UA + accept-language) to catch VPN hoppers
 *  7. Sends email alerts to you when IPs get blocked/permabanned
 *
 * NOTE: Auto-blocking is currently DISABLED (commented out).
 * All requests pass through — status labels are for dashboard visibility only.
 * Only admin can block IPs manually via dashboard or /api/admin/abuse/ban.
 * To re-enable auto-blocking, uncomment the marked sections below.
 */

import { Router, type Request, type Response, type NextFunction } from 'express'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { ipBlocklist } from './security'

/* ── Config ── */
const ADMIN_PASSWORD = process.env.ABUSE_ADMIN_PASSWORD || 'changeme-in-env'
const LOG_DIR = join(process.cwd(), 'data')
const LOG_FILE = join(LOG_DIR, 'abuse-log.json')
const ESCALATION_WINDOW_MS = 6 * 60 * 60 * 1000

/* Thresholds */
const WARN_AT = 3
const THROTTLE_AT = 5
const BLOCK_AT = 8
const PERMABAN_AT = 15
const HARD_BLOCK_AT = 100

/* Email alert config */
const ALERT_EMAIL_TO = process.env.EMAIL_TO || 'hrithikgh29@gmail.com'
const ALERT_EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@yourdomain.com'
const ALERT_ENABLED = process.env.ABUSE_ALERTS !== 'false'

/* ── Types ── */
interface AbuseAttempt {
  timestamp: string
  ip: string
  email: string
  endpoint: string
  userAgent: string
  acceptLanguage: string
  fingerprint: string
  country?: string
  blocked: boolean
}

interface AbuseRecord {
  ip: string
  fingerprint: string
  emails: string[]
  attempts: number
  firstSeen: string
  lastSeen: string
  status: 'clean' | 'warned' | 'throttled' | 'blocked' | 'permabanned'
  history: Array<{ time: string; email: string; endpoint: string }>
}

interface AbuseStore {
  records: Record<string, AbuseRecord>
  fingerprintMap: Record<string, string[]>
  attemptLog: AbuseAttempt[]
  totalBlocked: number
  lastUpdated: string
}

/* ── Persistence ── */
function loadStore(): AbuseStore {
  try {
    if (existsSync(LOG_FILE)) {
      const raw = readFileSync(LOG_FILE, 'utf-8')
      const parsed = JSON.parse(raw) as AbuseStore
      if (!parsed.attemptLog) parsed.attemptLog = []
      return parsed
    }
  } catch (err) {
    console.error('[Abuse] Failed to load log:', err)
  }
  return { records: {}, fingerprintMap: {}, attemptLog: [], totalBlocked: 0, lastUpdated: new Date().toISOString() }
}

function saveStore(s: AbuseStore): void {
  try {
    if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true })
    s.lastUpdated = new Date().toISOString()
    if (s.attemptLog.length > 1000) s.attemptLog = s.attemptLog.slice(-1000)
    writeFileSync(LOG_FILE, JSON.stringify(s, null, 2), 'utf-8')
  } catch (err) {
    console.error('[Abuse] Failed to save log:', err)
  }
}

let store = loadStore()
setInterval(() => saveStore(store), 5 * 60 * 1000)

/* ── Email Alert System ── */
function formatAlertHtml(subject: string, body: string): string {
  const lines = body.split('\n').map((l) => `<p style="margin:4px 0;font-family:monospace;font-size:13px;">${l}</p>`).join('')
  return `
    <div style="max-width:600px;margin:0 auto;padding:24px;background:#1a1a1a;border-radius:12px;border:1px solid #333;">
      <h2 style="color:#f5c6d6;margin:0 0 16px 0;font-size:18px;">⚠ ${subject}</h2>
      <div style="color:#ccc;">${lines}</div>
      <hr style="border:none;border-top:1px solid #333;margin:16px 0;" />
      <p style="color:#666;font-size:11px;">Sent by Portfolio Abuse Tracker · ${new Date().toISOString()}</p>
      <p style="color:#666;font-size:11px;">View full report: GET /api/admin/abuse</p>
    </div>`
}

async function sendAbuseAlert(subject: string, body: string): Promise<void> {
  if (!ALERT_ENABLED) return
  try {
    const nodemailer = await import('nodemailer').catch(() => null)
    if (nodemailer) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: {
          user: process.env.SMTP_USER || process.env.EMAIL_FROM,
          pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
        },
      })
      await transporter.sendMail({
        from: ALERT_EMAIL_FROM,
        to: ALERT_EMAIL_TO,
        subject: `⚠ [Portfolio Abuse] ${subject}`,
        text: body,
        html: formatAlertHtml(subject, body),
      })
      console.log(`[Abuse] Alert email sent: ${subject}`)
      return
    }

    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: ALERT_EMAIL_FROM, to: ALERT_EMAIL_TO,
          subject: `⚠ [Portfolio Abuse] ${subject}`,
          text: body, html: formatAlertHtml(subject, body),
        }),
      })
      console.log(`[Abuse] Alert sent via Resend: ${subject}`)
      return
    }

    console.warn(`[Abuse] EMAIL ALERT (no transport): ${subject}\n${body}`)
  } catch (err) {
    console.error(`[Abuse] Failed to send alert:`, err)
  }
}

const alertCooldowns = new Map<string, number>()
const ALERT_COOLDOWN_MS = 30 * 60 * 1000

function shouldAlert(ip: string): boolean {
  const last = alertCooldowns.get(ip) || 0
  if (Date.now() - last < ALERT_COOLDOWN_MS) return false
  alertCooldowns.set(ip, Date.now())
  return true
}

/* ── Fingerprinting ── */
function fingerprint(req: Request): string {
  const ua = req.headers['user-agent'] || ''
  const lang = req.headers['accept-language'] || ''
  let hash = 0
  const str = `${ua}|${lang}`
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return `fp_${Math.abs(hash).toString(36)}`
}

function getRecentAttempts(record: AbuseRecord): number {
  const cutoff = Date.now() - ESCALATION_WINDOW_MS
  return record.history.filter((h) => new Date(h.time).getTime() > cutoff).length
}

function escalateStatus(recent: number): AbuseRecord['status'] {
  if (recent >= PERMABAN_AT) return 'permabanned'
  if (recent >= BLOCK_AT) return 'blocked'
  if (recent >= THROTTLE_AT) return 'throttled'
  if (recent >= WARN_AT) return 'warned'
  return 'clean'
}

/* ── Main middleware ── */
export function abuseTracker(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  const email = String(req.body?.email || '').trim().toLowerCase()
  const endpoint = req.path
  const ua = req.headers['user-agent'] || ''
  const lang = req.headers['accept-language'] || ''
  const fp = fingerprint(req)
  const now = new Date().toISOString()

  const attempt: AbuseAttempt = {
    timestamp: now, ip, email, endpoint,
    userAgent: ua, acceptLanguage: lang,
    fingerprint: fp, blocked: false,
  }

  if (!store.records[ip]) {
    store.records[ip] = {
      ip, fingerprint: fp, emails: [], attempts: 0,
      firstSeen: now, lastSeen: now, status: 'clean', history: [],
    }
  }

  const record = store.records[ip]
  record.lastSeen = now
  record.attempts++
  record.fingerprint = fp
  record.history.push({ time: now, email, endpoint })

  if (email && !record.emails.includes(email)) record.emails.push(email)

  if (!store.fingerprintMap[fp]) store.fingerprintMap[fp] = []
  if (!store.fingerprintMap[fp].includes(ip)) store.fingerprintMap[fp].push(ip)

  const linkedIPs = store.fingerprintMap[fp] || []
  const linkedBanned = linkedIPs.some(
    (linkedIP) => store.records[linkedIP]?.status === 'permabanned' || store.records[linkedIP]?.status === 'blocked'
  )

  const recent = getRecentAttempts(record)
  record.status = escalateStatus(recent)

  const multipleEmails = record.emails.length > 3
  const rapidFire = record.history.filter(
    (h) => new Date(h.time).getTime() > Date.now() - 60_000
  ).length > 2

  if (multipleEmails || rapidFire) {
    record.status = record.status === 'clean' ? 'warned' : record.status
    /* [AUTO-BLOCK DISABLED] Old logic auto-escalated to blocked:
    if (multipleEmails && recent > 4) record.status = 'blocked'
    */
    // New: flag as warned only — admin decides whether to block
    if (multipleEmails && recent > 4 && record.status === 'clean') record.status = 'warned'
  }

  /* [AUTO-BLOCK DISABLED] Old logic: hard block at 100 attempts — added IP to blocklist
  if (record.attempts >= HARD_BLOCK_AT && !ipBlocklist.has(ip)) {
    ipBlocklist.add(ip)
    console.warn(`[Abuse] HARD BLOCKED after ${record.attempts} attempts: ${ip}`)
    if (shouldAlert(ip)) {
      void sendAbuseAlert(
        `HARD BLOCK — ${ip} (${record.attempts} attempts)`,
        `IP: ${ip}\nFingerprint: ${fp}\nTotal attempts: ${record.attempts}\nEmails used: ${record.emails.join(', ') || 'none'}\nStatus: HARD BLOCKED (all routes)\nFirst seen: ${record.firstSeen}\nLast seen: ${now}\nLinked IPs: ${linkedIPs.join(', ')}\n\nThis IP is now blocked from ALL routes.`
      )
    }
    saveStore(store)
  }
  */
  // New: flag at 100 — alert admin, but don't add to blocklist
  if (record.attempts >= HARD_BLOCK_AT) {
    console.warn(`[Abuse] ⚠ FLAGGED for admin review (${record.attempts} attempts): ${ip}`)
    if (shouldAlert(ip)) {
      void sendAbuseAlert(
        `⚠ HIGH VOLUME — ${ip} (${record.attempts} attempts)`,
        `IP: ${ip}\nFingerprint: ${fp}\nTotal attempts: ${record.attempts}\nEmails used: ${record.emails.join(', ') || 'none'}\nStatus: FLAGGED (not auto-blocked)\nFirst seen: ${record.firstSeen}\nLast seen: ${now}\nLinked IPs: ${linkedIPs.join(', ')}\n\nManually block via admin dashboard if needed.`
      )
    }
    saveStore(store)
  }

  /* [AUTO-BLOCK DISABLED] Old logic: rejected requests with 429 and added 3s throttle delay
  const isBlocked = record.status === 'blocked' || record.status === 'permabanned' || linkedBanned

  if (isBlocked) {
    store.totalBlocked++
    attempt.blocked = true
    store.attemptLog.push(attempt)

    console.warn(
      `[Abuse] BLOCKED | IP: ${ip} | FP: ${fp} | Email: ${email} | ` +
      `Status: ${record.status} | Attempts: ${record.attempts} | ` +
      `Unique emails: ${record.emails.length} | Linked IPs: ${linkedIPs.length}`
    )

    if (shouldAlert(ip)) {
      void sendAbuseAlert(
        `IP BLOCKED — ${ip} (${record.status})`,
        `IP: ${ip}\nFingerprint: ${fp}\nStatus: ${record.status}\nEmail: ${email}\nEndpoint: ${endpoint}\nTotal attempts: ${record.attempts}\nRecent (6h): ${recent}\nEmails used: ${record.emails.join(', ')}\nUser-Agent: ${ua}\nAccept-Language: ${lang}\nFirst seen: ${record.firstSeen}\nLast seen: ${now}\nLinked IPs: ${linkedIPs.join(', ')}\nLinked banned: ${linkedBanned}\n\nLast 5 attempts:\n${record.history.slice(-5).map((h) => `  ${h.time} — ${h.email} — ${h.endpoint}`).join('\n')}`
      )
    }

    saveStore(store)
    res.status(429).json({ error: 'Too many attempts. Your IP has been logged.', retryAfterMs: ESCALATION_WINDOW_MS })
    return
  }

  if (record.status === 'throttled') {
    console.warn(`[Abuse] THROTTLED | IP: ${ip} | Attempts: ${recent}/${BLOCK_AT}`)
    store.attemptLog.push(attempt)

    if (shouldAlert(ip)) {
      void sendAbuseAlert(
        `IP THROTTLED — ${ip} (${recent} recent)`,
        `IP: ${ip}\nFingerprint: ${fp}\nEmail: ${email}\nTotal: ${record.attempts}\nRecent (6h): ${recent}\nEmails: ${record.emails.join(', ')}\nStatus: THROTTLED (3s delay)\nNext: BLOCKED at ${BLOCK_AT}`
      )
    }

    setTimeout(() => next(), 3000)
    return
  }
  */
  // New: log flagged status but NEVER reject — all requests pass through
  const isFlagged = record.status === 'blocked' || record.status === 'permabanned' || record.status === 'throttled' || linkedBanned

  if (isFlagged) {
    attempt.blocked = false
    store.attemptLog.push(attempt)

    console.warn(
      `[Abuse] ⚠ FLAGGED | IP: ${ip} | FP: ${fp} | Email: ${email} | ` +
      `Status: ${record.status} | Attempts: ${record.attempts} | ` +
      `Unique emails: ${record.emails.length} | Linked IPs: ${linkedIPs.length}`
    )

    if (shouldAlert(ip)) {
      void sendAbuseAlert(
        `⚠ Suspicious activity — ${ip} (${record.status})`,
        `IP: ${ip}\nFingerprint: ${fp}\nStatus: ${record.status}\nEmail: ${email}\nEndpoint: ${endpoint}\nTotal attempts: ${record.attempts}\nRecent (6h): ${recent}\nEmails used: ${record.emails.join(', ')}\nUser-Agent: ${ua}\nAccept-Language: ${lang}\nFirst seen: ${record.firstSeen}\nLast seen: ${now}\nLinked IPs: ${linkedIPs.join(', ')}\n\nNot auto-blocked. Use admin dashboard to block if needed.`
      )
    }

    saveStore(store)
    next()
    return
  }

  if (record.status === 'warned') {
    console.warn(`[Abuse] WARNING | IP: ${ip} | Attempts: ${recent}/${THROTTLE_AT}`)
  }

  store.attemptLog.push(attempt)
  console.log(`[Abuse] ${record.status.toUpperCase()} | IP: ${ip} | Email: ${email} | Attempt #${record.attempts} (${recent} recent)`)
  next()
}

/* ── Admin dashboard API ── */
export const abuseAdminRouter = Router()

function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization
  if (!auth || auth !== `Bearer ${ADMIN_PASSWORD}`) {
    res.status(401).json({ error: 'Unauthorized. Set Authorization: Bearer <password>' })
    return
  }
  next()
}

abuseAdminRouter.use(adminAuth)

abuseAdminRouter.get('/abuse', (_req: Request, res: Response) => {
  const flagged = Object.values(store.records).filter((r) => r.status !== 'clean').sort((a, b) => b.attempts - a.attempts)
  const allRecords = Object.values(store.records).sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())

  res.json({
    summary: {
      totalTrackedIPs: Object.keys(store.records).length,
      totalFlagged: flagged.length,
      totalBlocked: store.totalBlocked,
      totalFingerprints: Object.keys(store.fingerprintMap).length,
      totalAttempts: store.attemptLog.length,
      lastUpdated: store.lastUpdated,
    },
    flagged: flagged.map((r) => ({
      ip: r.ip, fingerprint: r.fingerprint, status: r.status, attempts: r.attempts,
      uniqueEmails: r.emails, recentAttempts: getRecentAttempts(r),
      firstSeen: r.firstSeen, lastSeen: r.lastSeen,
      linkedIPs: store.fingerprintMap[r.fingerprint] || [],
      recentHistory: r.history.slice(-10),
    })),
    recentActivity: allRecords.slice(0, 20).map((r) => ({ ip: r.ip, status: r.status, lastSeen: r.lastSeen, attempts: r.attempts })),
    recentAttempts: store.attemptLog.slice(-20),
  })
})

abuseAdminRouter.get('/abuse/ip/:ip', (req: Request, res: Response) => {
  const record = store.records[req.params.ip as string]
  if (!record) {
    res.status(404).json({ error: 'IP not found in abuse log.' })
    return
  }
  const linkedIPs = store.fingerprintMap[record.fingerprint] || []
  const linkedRecords = linkedIPs.filter((ip) => ip !== record.ip).map((ip) => store.records[ip]).filter(Boolean)
  const ipAttempts = store.attemptLog.filter((a) => a.ip === record.ip)

  res.json({
    ip: record.ip, fingerprint: record.fingerprint, status: record.status,
    attempts: record.attempts, recentAttempts: getRecentAttempts(record),
    uniqueEmails: record.emails, firstSeen: record.firstSeen, lastSeen: record.lastSeen,
    hardBlocked: ipBlocklist.has(record.ip),
    fullHistory: record.history, detailedAttempts: ipAttempts.slice(-50),
    linkedIPs: linkedRecords.map((r) => ({ ip: r.ip, status: r.status, attempts: r.attempts, emails: r.emails })),
  })
})

/* POST /api/admin/abuse/ban — ONLY way to block an IP (manual admin action) */
abuseAdminRouter.post('/abuse/ban', (req: Request, res: Response) => {
  const { ip } = req.body as { ip?: string }
  if (!ip) {
    res.status(400).json({ error: 'IP required.' })
    return
  }
  if (!store.records[ip]) {
    store.records[ip] = {
      ip, fingerprint: 'manual', emails: [], attempts: 0,
      firstSeen: new Date().toISOString(), lastSeen: new Date().toISOString(),
      status: 'permabanned',
      history: [{ time: new Date().toISOString(), email: 'MANUAL_BAN', endpoint: '/admin' }],
    }
  } else {
    store.records[ip].status = 'permabanned'
  }
  ipBlocklist.add(ip)
  saveStore(store)
  console.warn(`[Abuse] MANUAL BAN | IP: ${ip}`)
  res.json({ success: true, ip, status: 'permabanned' })
})

abuseAdminRouter.post('/abuse/unban', (req: Request, res: Response) => {
  const { ip } = req.body as { ip?: string }
  if (!ip || !store.records[ip]) {
    res.status(404).json({ error: 'IP not found.' })
    return
  }
  store.records[ip].status = 'clean'
  store.records[ip].history = []
  ipBlocklist.delete(ip)
  saveStore(store)
  console.log(`[Abuse] UNBANNED | IP: ${ip}`)
  res.json({ success: true, ip, status: 'clean' })
})

abuseAdminRouter.delete('/abuse/clear', (_req: Request, res: Response) => {
  store = { records: {}, fingerprintMap: {}, attemptLog: [], totalBlocked: 0, lastUpdated: new Date().toISOString() }
  ipBlocklist.clear()
  saveStore(store)
  console.log('[Abuse] All abuse data cleared by admin.')
  res.json({ success: true, message: 'Abuse log cleared.' })
})