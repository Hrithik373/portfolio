import type { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'
import helmet from 'helmet'
import hpp from 'hpp'

/** IPs to hard-block. abuse-tracker.ts auto-adds IPs at 100 attempts. */
export const ipBlocklist = new Set<string>()

const BOT_UA_FRAGMENTS = [
  'sqlmap',
  'nikto',
  'nmap',
  'masscan',
  'zgrab',
  'gobuster',
  'dirbuster',
  'wpscan',
  'nuclei',
  'python-requests',
  'go-http-client',
  'scrapy',
]

const SUSPICIOUS_PATH_PREFIXES = [
  '/.env',
  '/.git',
  '/wp-admin',
  '/wp-login',
  '/phpmyadmin',
  '/admin.php',   // Changed from '/admin' — was blocking /api/admin/*
  '/config.php',  // Changed from '/config' — was blocking /api/config if you ever add one
  '/backup',
  '/shell',
]

function parseCorsOrigins(): string[] {
  const fromEnv = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const defaults = ['http://localhost:5173', 'http://localhost:3000', 'http://10.5.0.2:3000', 'null']
  return [...new Set([...defaults, ...fromEnv])]
}

function suspiciousPathBlocker(req: Request, res: Response, next: NextFunction) {
  const p = req.path || ''
  const lower = p.toLowerCase()
  for (const prefix of SUSPICIOUS_PATH_PREFIXES) {
    if (lower === prefix || lower.startsWith(prefix + '/') || lower.startsWith(prefix + '?')) {
      return res.status(404).end()
    }
  }
  next()
}

function ipBlocklistMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || ''
  if (ip && ipBlocklist.has(ip)) {
    return res.status(403).end()
  }
  next()
}

function botUserAgentBlocker(req: Request, res: Response, next: NextFunction) {
  const ua = (req.get('user-agent') || '').toLowerCase()
  if (!ua) {
    return next()
  }
  for (const frag of BOT_UA_FRAGMENTS) {
    if (ua.includes(frag)) {
      return res.status(403).end()
    }
  }
  next()
}

function productionRequestLogger(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV !== 'production') {
    return next()
  }
  const ts = new Date().toISOString()
  const ip = req.ip || req.socket.remoteAddress || '-'
  console.info(`[req] ${ts} ${req.method} ${req.path} ${ip}`)
  next()
}

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
})

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: (used, req) => {
    void req
    const over = Math.max(0, used - 50)
    return over * 200
  },
})

const strictEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
})

function strictEmailLimiterGate(req: Request, res: Response, next: NextFunction) {
  const p = req.path || ''
  /* [OLD] Voice notes shared email limit — now has own Redis limit in cache.ts:
  if ((p === '/api/send-email' || p === '/api/voice-note') && req.method === 'POST') {
    return strictEmailLimiter(req, res, next)
  }
  */
  if (p === '/api/send-email' && req.method === 'POST') {
    return strictEmailLimiter(req, res, next)
  }
  next()
}

/**
 * Apply security middleware. Call once when wiring the Express app.
 */
export function applySecurity(app: Express): void {
  app.set('trust proxy', 1)

  app.use(productionRequestLogger)
  app.use(suspiciousPathBlocker)

  app.use(
    helmet({
      contentSecurityPolicy: false,
      hsts: {
        maxAge: 63072000,
        includeSubDomains: true,
        preload: true,
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  )

  app.use(
    cors({
      origin(origin, callback) {
        const allowed = parseCorsOrigins()
        if (!origin) {
          return callback(null, true)
        }
        if (allowed.includes(origin)) {
          return callback(null, true)
        }
        return callback(null, false)
      },
      methods: ['GET', 'POST', 'OPTIONS'],
      maxAge: 86400,
    }),
  )

  app.use(ipBlocklistMiddleware)
  app.use(botUserAgentBlocker)
  app.use(globalLimiter)
  app.use(speedLimiter)

  app.use(express.json({ limit: '50kb' }))
  app.use(express.urlencoded({ extended: false, limit: '50kb' }))
  app.use(hpp())

  app.use(strictEmailLimiterGate)
}
