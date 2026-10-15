// Server-only client for football-data.org. The API key never leaves the server.

const BASE_URL = 'https://api.football-data.org/v4'

/**
 * Competitions available on the free tier (TIER_ONE). Confirmed against
 * GET /v4/competitions with a free key.
 */
export const FREE_COMPETITIONS = [
  'PL', // Premier League
  'PD', // La Liga
  'CL', // Champions League
  'SA', // Serie A
  'BL1', // Bundesliga
  'FL1', // Ligue 1
  'DED', // Eredivisie
  'PPL', // Primeira Liga
  'ELC', // Championship
  'BSA', // Brasileirão Série A
  'EC', // European Championship
  'WC', // FIFA World Cup
] as const

/** Max days per /matches request we use on the free tier (dateTo - dateFrom). */
export const MAX_RANGE_DAYS = 10

export class UpstreamError extends Error {
  status: number
  retryAfter?: number

  constructor(message: string, status: number, retryAfter?: number) {
    super(message)
    this.status = status
    this.retryAfter = retryAfter
  }
}

/** The server itself is misconfigured (e.g. missing API key). */
export class ConfigError extends Error {}

export async function fetchFootballData<T>(path: string): Promise<T> {
  const key = process.env.FOOTBALL_DATA_API_KEY
  if (!key) {
    throw new ConfigError('FOOTBALL_DATA_API_KEY is not set on the server')
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'X-Auth-Token': key },
  })

  if (!res.ok) {
    let message = `football-data.org responded with ${res.status}`
    try {
      const body = (await res.json()) as { message?: string }
      if (body.message) message = body.message
    } catch {
      // Non-JSON error body; keep the default message.
    }
    // The API reports seconds until the per-minute counter resets.
    const reset = Number(res.headers.get('X-RequestCounter-Reset') ?? res.headers.get('Retry-After'))
    const retryAfter = Number.isFinite(reset) && reset > 0 ? reset : res.status === 429 ? 60 : undefined
    throw new UpstreamError(message, res.status, retryAfter)
  }

  return (await res.json()) as T
}
