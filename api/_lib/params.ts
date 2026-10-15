import { FREE_COMPETITIONS } from './footballData.js'

/**
 * Path segments after /api/, e.g. /api/teams/65/matches -> ['teams', '65', 'matches'].
 * Read from the URL so handlers work the same on Vercel and in the dev middleware.
 */
export function pathSegments(request: Request): string[] {
  return new URL(request.url).pathname
    .replace(/^\/api\//, '')
    .split('/')
    .filter(Boolean)
    .map(decodeURIComponent)
}

/**
 * A competition code our key can access, or null. Checked against FREE_COMPETITIONS,
 * which is exactly what GET /v4/competitions returns for this key (verified), so
 * validation never spends an upstream request.
 */
export function competitionCode(value: string | undefined): string | null {
  const code = value?.toUpperCase()
  return code && (FREE_COMPETITIONS as readonly string[]).includes(code) ? code : null
}

export function isPositiveInt(value: string | undefined): value is string {
  return !!value && /^[1-9]\d{0,8}$/.test(value)
}
