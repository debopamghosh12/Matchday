import { ConfigError, UpstreamError } from './footballData.js'

/**
 * Cache-Control for a successful response. `s-maxage` is honoured by the Vercel
 * CDN (and stripped before the response reaches the browser); `max-age=0` keeps
 * browsers from holding on to it, so React Query stays in charge client-side.
 * `stale-while-revalidate` lets the CDN serve the old copy instantly while it
 * refreshes in the background, so bursts of traffic cost one upstream call.
 */
export function cacheControl(sMaxAge: number, staleWhileRevalidate: number): string {
  return `public, max-age=0, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  })
}

export function errorResponse(err: unknown): Response {
  if (err instanceof UpstreamError) {
    const status = err.status === 429 ? 429 : err.status >= 500 ? 502 : err.status
    const headers: Record<string, string> = { 'Cache-Control': 'no-store' }
    if (err.retryAfter) headers['Retry-After'] = String(err.retryAfter)
    return json({ error: err.message, status, retryAfter: err.retryAfter }, status, headers)
  }
  if (err instanceof ConfigError) {
    return json({ error: err.message, status: 500 }, 500, { 'Cache-Control': 'no-store' })
  }
  console.error(err)
  return json({ error: 'Unexpected server error', status: 500 }, 500, { 'Cache-Control': 'no-store' })
}
