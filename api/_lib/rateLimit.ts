import type { VercelRequest, VercelResponse } from '@vercel/node'

// In-memory rate limiter (resets on cold start, fine for serverless)
const store = new Map<string, { count: number; resetAt: number }>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of store) {
    if (now > val.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

type RateLimitConfig = {
  maxRequests: number
  windowMs: number  // milliseconds
}

const LIMITS: Record<string, RateLimitConfig> = {
  '/api/tables': { maxRequests: 100, windowMs: 60_000 },
  '/api/stats':  { maxRequests: 50,  windowMs: 60_000 },
  '/api/sql':    { maxRequests: 20,  windowMs: 60_000 },
}

function getConfig(path: string): RateLimitConfig {
  for (const [prefix, config] of Object.entries(LIMITS)) {
    if (path.startsWith(prefix)) return config
  }
  return { maxRequests: 100, windowMs: 60_000 }
}

function getIP(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
  return req.socket?.remoteAddress || 'unknown'
}

/**
 * Returns true if rate limit exceeded (caller should return 429).
 */
export function checkRateLimit(req: VercelRequest, res: VercelResponse): boolean {
  const ip = getIP(req)
  const path = req.url || ''
  const config = getConfig(path)
  const key = `${ip}:${path.split('?')[0]}`
  const now = Date.now()

  let entry = store.get(key)
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + config.windowMs }
    store.set(key, entry)
  }

  entry.count++

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', config.maxRequests)
  res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - entry.count))
  res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000))

  if (entry.count > config.maxRequests) {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    })
    return true
  }

  return false
}
