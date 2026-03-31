/**
 * Persistent Cache Layer — Upstash Redis (serverless, free tier)
 * Place at: backend/cache.ts
 *
 * What this adds on top of in-memory rate limiting:
 *  1. Rate limits persist across Render cold starts
 *  2. Abuse records cached in Redis with TTL (auto-expire)
 *  3. Cross-instance consistency (if you ever scale to 2+ instances)
 *  4. IP reputation scoring persists permanently
 *  5. Blocked IPs survive restarts without needing the JSON file
 *
 * Install: npm install @upstash/redis @upstash/ratelimit
 *
 * Usage in backend/server.ts:
 *   import { cacheRateLimit, cacheMiddleware, cacheAdminRouter } from './cache'
 *
 *   // Add BEFORE abuseTracker on email routes:
 *   app.post('/api/send-email', cacheRateLimit, abuseTracker, rejectHoneypot, validateContact, handler)
 *
 *   // Mount cache admin:
 *   app.use('/api/admin/cache', cacheAdminRouter)
 */

import { Router, type Request, type Response, type NextFunction } from 'express'

/* ── Lazy Redis init — only connects when first used ── */
let redisClient: {
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string, opts?: { ex?: number }) => Promise<string | null>
  incr: (key: string) => Promise<number>
  expire: (key: string, seconds: number) => Promise<number>
  del: (...keys: string[]) => Promise<number>
  keys: (pattern: string) => Promise<string[]>
  ttl: (key: string) => Promise<number>
  exists: (...keys: string[]) => Promise<number>
} | null = null

let redisAvailable = false

async function getRedis() {
  if (redisClient) return redisClient
  
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.warn('[Cache] Upstash Redis not configured — falling back to in-memory only')
    return null
  }

  try {
    const { Redis } = await import('@upstash/redis')
    redisClient = new Redis({ url, token }) as unknown as typeof redisClient
    // Test connection
    await redisClient!.set('cache:ping', 'pong', { ex: 60 })
    redisAvailable = true
    console.log('[Cache] Upstash Redis connected ✓')
    return redisClient
  } catch (err) {
    console.error('[Cache] Failed to connect to Upstash Redis:', err)
    redisAvailable = false
    return null
  }
}

/* ── Config ── */
const ADMIN_PASSWORD = process.env.ABUSE_ADMIN_PASSWORD || 'changeme-in-env'

/* Rate limit windows */
const WINDOWS = {
  global: { prefix: 'rl:global', max: 100, windowSec: 15 * 60 },       // 100/15min
  email: { prefix: 'rl:email', max: 5, windowSec: 60 * 60 },           // 5/hour
  voice: { prefix: 'rl:voice', max: 10, windowSec: 60 * 60 },          // 10/hour (separate from email)
  ai: { prefix: 'rl:ai', max: 3, windowSec: 60 },                      // 3/min
} as const

/* ── Persistent Rate Limiter ── */
async function checkRateLimit(
  ip: string,
  window: typeof WINDOWS[keyof typeof WINDOWS],
): Promise<{ allowed: boolean; remaining: number; resetInSec: number }> {
  const redis = await getRedis()
  
  if (!redis) {
    // No Redis — allow (in-memory limiter in security.ts is the fallback)
    return { allowed: true, remaining: window.max, resetInSec: 0 }
  }

  const key = `${window.prefix}:${ip}`
  
  try {
    const current = await redis.incr(key)
    
    // Set TTL on first request in window
    if (current === 1) {
      await redis.expire(key, window.windowSec)
    }

    const ttl = await redis.ttl(key)
    const remaining = Math.max(0, window.max - current)

    return {
      allowed: current <= window.max,
      remaining,
      resetInSec: ttl > 0 ? ttl : window.windowSec,
    }
  } catch (err) {
    console.error('[Cache] Rate limit check failed:', err)
    return { allowed: true, remaining: window.max, resetInSec: 0 }
  }
}

/* ── IP Reputation Cache ── */
async function getIPReputation(ip: string): Promise<{
  totalAttempts: number
  blocked: boolean
  threatScore: number
  lastSeen: string
} | null> {
  const redis = await getRedis()
  if (!redis) return null

  try {
    const data = await redis.get(`ip:rep:${ip}`)
    if (!data) return null
    return typeof data === 'string' ? JSON.parse(data) : data as {
      totalAttempts: number
      blocked: boolean
      threatScore: number
      lastSeen: string
    }
  } catch {
    return null
  }
}

async function setIPReputation(ip: string, data: {
  totalAttempts: number
  blocked: boolean
  threatScore: number
  lastSeen: string
}): Promise<void> {
  const redis = await getRedis()
  if (!redis) return

  try {
    // IP reputation expires after 30 days of inactivity
    await redis.set(`ip:rep:${ip}`, JSON.stringify(data), { ex: 30 * 24 * 60 * 60 })
  } catch (err) {
    console.error('[Cache] Failed to set IP reputation:', err)
  }
}

/* ── Blocked IP Cache (survives restarts) ── */
async function isIPBlockedInCache(ip: string): Promise<boolean> {
  const redis = await getRedis()
  if (!redis) return false

  try {
    return (await redis.exists(`ip:blocked:${ip}`)) > 0
  } catch {
    return false
  }
}

async function blockIPInCache(ip: string, reason: string, durationSec?: number): Promise<void> {
  const redis = await getRedis()
  if (!redis) return

  try {
    const data = JSON.stringify({ reason, blockedAt: new Date().toISOString() })
    if (durationSec) {
      await redis.set(`ip:blocked:${ip}`, data, { ex: durationSec })
    } else {
      // Permanent — 1 year TTL
      await redis.set(`ip:blocked:${ip}`, data, { ex: 365 * 24 * 60 * 60 })
    }
    console.log(`[Cache] IP blocked in Redis: ${ip} — ${reason}`)
  } catch (err) {
    console.error('[Cache] Failed to block IP:', err)
  }
}

async function unblockIPInCache(ip: string): Promise<void> {
  const redis = await getRedis()
  if (!redis) return

  try {
    await redis.del(`ip:blocked:${ip}`)
    console.log(`[Cache] IP unblocked in Redis: ${ip}`)
  } catch (err) {
    console.error('[Cache] Failed to unblock IP:', err)
  }
}

/* ── Device fingerprint cache ── */
async function cacheDeviceFingerprint(deviceId: string, ip: string): Promise<string[]> {
  const redis = await getRedis()
  if (!redis) return []

  try {
    const key = `device:ips:${deviceId}`
    const existing = await redis.get(key)
    const ips: string[] = existing
      ? (typeof existing === 'string' ? JSON.parse(existing) : existing as string[])
      : []

    if (!ips.includes(ip)) {
      ips.push(ip)
      await redis.set(key, JSON.stringify(ips), { ex: 90 * 24 * 60 * 60 }) // 90 days
    }

    return ips
  } catch {
    return []
  }
}

/* ── Rate Limit Middleware (drop-in for Express) ── */
export function cacheRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  const path = req.path || ''

  // Pick the right window
  /* [OLD] Voice grouped with email — now separated:
  const window = path.includes('send-email') || path.includes('voice-note')
    ? WINDOWS.email
    : path.includes('/ai/')
      ? WINDOWS.ai
      : WINDOWS.global
  */
  const window = path.includes('voice-note')
    ? WINDOWS.voice
    : path.includes('send-email')
      ? WINDOWS.email
      : path.includes('/ai/')
        ? WINDOWS.ai
        : WINDOWS.global

  // Check Redis-backed blocked list first
  void isIPBlockedInCache(ip).then((blocked) => {
    if (blocked) {
      res.status(403).json({ error: 'IP permanently blocked.' })
      return
    }

    // Check rate limit
    void checkRateLimit(ip, window).then((result) => {
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', window.max)
      res.setHeader('X-RateLimit-Remaining', result.remaining)
      res.setHeader('X-RateLimit-Reset', result.resetInSec)

      if (!result.allowed) {
        res.status(429).json({
          error: 'Rate limit exceeded.',
          retryAfterMs: result.resetInSec * 1000,
        })
        return
      }

      next()
    }).catch(() => next()) // Redis error — let request through
  }).catch(() => next())
}

/* ── Cache Middleware (updates IP reputation after each request) ── */
export function cacheMiddleware(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'

  // After response is sent, update IP reputation in Redis
  res.on('finish', () => {
    void (async () => {
      try {
        const existing = await getIPReputation(ip)
        const statusCode = res.statusCode

        await setIPReputation(ip, {
          totalAttempts: (existing?.totalAttempts || 0) + 1,
          blocked: existing?.blocked || statusCode === 429 || statusCode === 403,
          threatScore: existing?.threatScore || 0,
          lastSeen: new Date().toISOString(),
        })
      } catch {
        // Silent fail — don't crash on cache errors
      }
    })()
  })

  next()
}

/* ── Exported helpers for abuse-tracker integration ── */
export const cache = {
  getIPReputation,
  setIPReputation,
  isIPBlockedInCache,
  blockIPInCache,
  unblockIPInCache,
  cacheDeviceFingerprint,
  checkRateLimit,
  get isAvailable() { return redisAvailable },
}

/* ── Admin API ── */
export const cacheAdminRouter = Router()

function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization
  if (!auth || auth !== `Bearer ${ADMIN_PASSWORD}`) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}

cacheAdminRouter.use(adminAuth)

/* GET /api/admin/cache/status — Redis connection status + stats */
cacheAdminRouter.get('/status', (_req: Request, res: Response) => {
  void (async () => {
    const redis = await getRedis()
    if (!redis) {
      res.json({ connected: false, message: 'Redis not configured or unavailable' })
      return
    }

    try {
      const ping = await redis.get('cache:ping')
      res.json({
        connected: true,
        ping: ping || 'no-ping',
        upstashUrl: process.env.UPSTASH_REDIS_REST_URL?.replace(/\/\/.*@/, '//***@') || 'not-set',
      })
    } catch (err) {
      res.json({ connected: false, error: String(err) })
    }
  })()
})

/* GET /api/admin/cache/ip/:ip — lookup IP in cache */
cacheAdminRouter.get('/ip/:ip', (req: Request, res: Response) => {
  void (async () => {
    const ip = req.params.ip as string
    const reputation = await getIPReputation(ip)
    const blocked = await isIPBlockedInCache(ip)

    res.json({ ip, reputation, blocked })
  })()
})

/* POST /api/admin/cache/block — block IP in Redis */
cacheAdminRouter.post('/block', (req: Request, res: Response) => {
  void (async () => {
    const { ip, reason, durationSec } = req.body as {
      ip?: string
      reason?: string
      durationSec?: number
    }
    if (!ip) {
      res.status(400).json({ error: 'IP required.' })
      return
    }
    await blockIPInCache(ip, reason || 'Manual block', durationSec)
    res.json({ success: true, ip, blocked: true })
  })()
})

/* POST /api/admin/cache/unblock — unblock IP in Redis */
cacheAdminRouter.post('/unblock', (req: Request, res: Response) => {
  void (async () => {
    const { ip } = req.body as { ip?: string }
    if (!ip) {
      res.status(400).json({ error: 'IP required.' })
      return
    }
    await unblockIPInCache(ip)
    res.json({ success: true, ip, blocked: false })
  })()
})

/* DELETE /api/admin/cache/flush — clear all cache data */
cacheAdminRouter.delete('/flush', (_req: Request, res: Response) => {
  void (async () => {
    const redis = await getRedis()
    if (!redis) {
      res.json({ success: false, message: 'Redis not available' })
      return
    }

    try {
      // Delete all keys with our prefixes
      const prefixes = ['rl:', 'ip:', 'device:', 'cache:']
      let deleted = 0

      for (const prefix of prefixes) {
        const keys = await redis.keys(`${prefix}*`)
        if (keys.length > 0) {
          await redis.del(...keys)
          deleted += keys.length
        }
      }

      res.json({ success: true, keysDeleted: deleted })
    } catch (err) {
      res.status(500).json({ error: String(err) })
    }
  })()
})
