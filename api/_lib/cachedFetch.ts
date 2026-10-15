import { cacheGet, cacheSet } from './cache.js'
import { UpstreamError, fetchFootballData } from './footballData.js'

// Upstream calls in progress, so concurrent requests for the same resource on a
// warm instance share one call instead of each spending rate limit.
const inFlight = new Map<string, Promise<unknown>>()

/**
 * GET an upstream path through the best-effort cache: fresh hit, else a shared
 * in-flight call, else upstream. On an upstream error, serve a stale copy if
 * this instance still has one.
 */
export function cachedFetch<T>(key: string, path: string, ttlSeconds: number): Promise<T> {
  const cached = cacheGet<T>(key)
  if (cached !== undefined) return Promise.resolve(cached)

  let pending = inFlight.get(key) as Promise<T> | undefined
  if (!pending) {
    pending = (async () => {
      try {
        const data = await fetchFootballData<T>(path)
        cacheSet(key, data, ttlSeconds)
        return data
      } catch (err) {
        const stale = cacheGet<T>(key, { allowStale: true })
        if (stale !== undefined && err instanceof UpstreamError) return stale
        throw err
      }
    })().finally(() => inFlight.delete(key))
    inFlight.set(key, pending)
  }
  return pending
}
