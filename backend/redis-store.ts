import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { Redis } from '@upstash/redis'

const DATA_DIR = join(process.cwd(), 'data')

let redisClient: Redis | null = null
let redisReady = false

function getRedis(): Redis | null {
  if (redisClient) return redisClient
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  try {
    redisClient = new Redis({ url, token })
    redisReady = true
    console.log('[RedisStore] Connected to Upstash Redis ✓')
    return redisClient
  } catch (err) {
    console.error('[RedisStore] Failed to connect:', err)
    return null
  }
}

/**
 * Load data: tries Redis first, falls back to JSON file, returns default if neither exists.
 * On startup, if Redis has data but JSON doesn't (post-restart), Redis wins.
 * If JSON has data but Redis doesn't (first deploy), migrates JSON → Redis.
 */
export async function loadData<T>(key: string, defaultValue: T): Promise<T> {
  const jsonFile = join(DATA_DIR, `${key}.json`)

  // Try Redis first
  const redis = getRedis()
  if (redis) {
    try {
      const data = await redis.get<T>(`store:${key}`)
      if (data !== null && data !== undefined) {
        // Write local cache
        try {
          if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
          writeFileSync(jsonFile, JSON.stringify(data, null, 2), 'utf-8')
        } catch { /* non-fatal */ }
        console.log(`[RedisStore] Loaded ${key} from Redis`)
        return data
      }
    } catch (err) {
      console.error(`[RedisStore] Failed to load ${key} from Redis:`, err)
    }
  }

  // Fall back to JSON file
  try {
    if (existsSync(jsonFile)) {
      const raw = readFileSync(jsonFile, 'utf-8')
      const parsed = JSON.parse(raw) as T
      // Migrate to Redis if available
      if (redis) {
        try {
          await redis.set(`store:${key}`, JSON.stringify(parsed))
          console.log(`[RedisStore] Migrated ${key} from JSON → Redis`)
        } catch { /* non-fatal */ }
      }
      return parsed
    }
  } catch (err) {
    console.error(`[RedisStore] Failed to load ${key} from JSON:`, err)
  }

  return defaultValue
}

/**
 * Save data: writes to BOTH Redis and JSON file.
 * Redis is the source of truth. JSON is local cache for fast reads.
 */
export async function saveData<T>(key: string, data: T): Promise<void> {
  const jsonFile = join(DATA_DIR, `${key}.json`)

  // Save to Redis (primary)
  const redis = getRedis()
  if (redis) {
    try {
      await redis.set(`store:${key}`, JSON.stringify(data))
    } catch (err) {
      console.error(`[RedisStore] Failed to save ${key} to Redis:`, err)
    }
  }

  // Save to JSON (local cache)
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
    writeFileSync(jsonFile, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.error(`[RedisStore] Failed to save ${key} to JSON:`, err)
  }
}

export function isRedisAvailable(): boolean {
  return redisReady
}
