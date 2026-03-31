
/**
 * Render Backend — Security Middleware Stack
 * Place this file at: server/security.ts (or .js)
 *
 * Install dependencies:
 *   npm install helmet cors express-rate-limit express-slow-down hpp
 *   npm install -D @types/cors @types/hpp
 *
 * Usage in your Express app:
 *   import { applySecurity } from './security'
 *   const app = express()
 *   applySecurity(app)
 */

import type { Express, Request, Response, NextFunction } from 'express'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'
import hpp from 'hpp'

/* ── Config ── */
const ALLOWED_ORIGINS = [
  'https://yourdomain.com',       // ← replace
  'https://www.yourdomain.com',
  'http://localhost:3000',
  'http://localhost:5173',
]

const isProduction = process.env.NODE_ENV === 'production'

/* ── Blocked IPs (add known bad actors here) ── */
const BLOCKED_IPS = new Set<string>([
  // Add IPs as needed, e.g. '1.2.3.4'
])

/* ── Suspicious user agents ── */
const BOT_PATTERNS = [
  /sqlmap/i, /nikto/i, /nmap/i, /masscan/i, /zgrab/i,
  /gobuster/i, /dirbuster/i, /wpscan/i, /nuclei/i,
  /python-requests/i, /go-http-client/i, /scrapy/i,
]

export function applySecurity(app: Express): void {
  /* ── Trust proxy (Render is behind a reverse proxy) ── */
  app.set('trust proxy', 1)

  /* ── 1. Helmet — sets ~15 security headers in one line ── */
  app.use(
    helmet({
      contentSecurityPolicy: false, // frontend handles CSP
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
    })
  )

  /* ── 2. CORS — lock to your frontend domain ── */
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, server-to-server)
        if (!origin) return callback(null, true)
        if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
        return callback(new Error('CORS rejected'))
      },
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: false,
      maxAge: 86400,
    })
  )

  /* ── 3. Body parsers with size limits ── */
  app.use(express.json({ limit: '50kb' }))
  app.use(express.urlencoded({ extended: false, limit: '50kb' }))

  /* ── 4. HPP — prevent HTTP parameter pollution ── */
  app.use(hpp())

  /* ── 5. IP blocklist ── */
  app.use((req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || ''
    if (BLOCKED_IPS.has(ip)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  })

  /* ── 6. Bot / scanner blocker ── */
  app.use((req: Request, res: Response, next: NextFunction) => {
    const ua = req.headers['user-agent'] || ''
    if (BOT_PATTERNS.some((p) => p.test(ua))) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  })

  /* ── 7. Global rate limiter — 100 requests / 15 min per IP ── */
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests', retryAfterMs: 900000 },
      keyGenerator: (req) => req.ip || req.socket.remoteAddress || 'unknown',
    })
  )

  /* ── 8. Speed limiter — slow down after 50 requests (delays responses) ── */
  app.use(
    slowDown({
      windowMs: 15 * 60 * 1000,
      delayAfter: 50,
      delayMs: (hits) => (hits - 50) * 200, // adds 200ms per extra request
    })
  )

  /* ── 9. Strict rate limit for email / contact endpoints ── */
  const emailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,                   // 5 emails per hour per IP
    message: { error: 'Email rate limit reached', retryAfterMs: 3600000 },
    keyGenerator: (req) => req.ip || 'unknown',
  })
  app.use('/api/send-email', emailLimiter)
  app.use('/api/newsletter', emailLimiter)

  /* ── 10. Request logging (lightweight, no dependencies) ── */
  if (isProduction) {
    app.use((req: Request, _res: Response, next: NextFunction) => {
      const timestamp = new Date().toISOString()
      const ip = req.ip || req.socket.remoteAddress
      console.log(`[${timestamp}] ${req.method} ${req.path} — ${ip}`)
      next()
    })
  }

  /* ── 11. Catch suspicious paths ── */
  const suspiciousPaths = ['/.env', '/.git', '/wp-admin', '/wp-login', '/phpmyadmin', '/admin', '/config', '/backup', '/shell']
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (suspiciousPaths.some((p) => req.path.toLowerCase().startsWith(p))) {
      return res.status(404).end()
    }
    next()
  })
}
