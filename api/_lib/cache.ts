// Best-effort in-memory TTL cache. Serverless instances are short-lived and not
// shared, so this only helps when an instance stays warm. The CDN cache headers
// set by each handler are the real protection against the upstream rate limit.

interface Entry<T> {
  value: T
  expiresAt: number
}

const store = new Map<string, Entry<unknown>>()
const MAX_ENTRIES = 200

export function cacheGet<T>(key: string, { allowStale = false } = {}): T | undefined {
  const entry = store.get(key) as Entry<T> | undefined
  if (!entry) return undefined
  if (!allowStale && entry.expiresAt < Date.now()) return undefined
  return entry.value
}

export function cacheSet<T>(key: string, value: T, ttlSeconds: number): void {
  if (store.size >= MAX_ENTRIES) {
    // Drop the oldest insertion; good enough for a tiny best-effort cache.
    const oldest = store.keys().next().value
    if (oldest !== undefined) store.delete(oldest)
  }
  store.delete(key)
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
}
