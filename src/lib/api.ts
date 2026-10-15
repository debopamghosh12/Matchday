// Client for our own /api proxy (never calls football-data.org directly).

import type {
  ApiErrorBody,
  CompetitionsResponse,
  MatchesResponse,
  ScorersResponse,
  StandingsResponse,
  TeamDetails,
  TeamMatchesResponse,
} from '../types/football'

export class ApiError extends Error {
  status: number
  retryAfter?: number

  constructor(message: string, status: number, retryAfter?: number) {
    super(message)
    this.status = status
    this.retryAfter = retryAfter
  }

  get isRateLimited(): boolean {
    return this.status === 429
  }
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, { signal })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new ApiError('Network error. Check your connection.', 0)
  }

  if (!res.ok) {
    let body: Partial<ApiErrorBody> = {}
    try {
      body = (await res.json()) as ApiErrorBody
    } catch {
      // Non-JSON error (e.g. platform error page).
    }
    const retryAfter = body.retryAfter ?? (Number(res.headers.get('Retry-After')) || undefined)
    throw new ApiError(body.error ?? `Request failed (${res.status})`, res.status, retryAfter)
  }
  return (await res.json()) as T
}

export function fetchMatches(from: string, to: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ from, to })
  return getJson<MatchesResponse>(`/api/matches?${params}`, signal)
}

export function fetchCompetitions(signal?: AbortSignal) {
  return getJson<CompetitionsResponse>('/api/competitions', signal)
}

export function fetchStandings(code: string) {
  return getJson<StandingsResponse>(`/api/standings/${encodeURIComponent(code)}`)
}

export function fetchScorers(code: string) {
  return getJson<ScorersResponse>(`/api/scorers/${encodeURIComponent(code)}`)
}

export function fetchTeam(id: number) {
  return getJson<TeamDetails>(`/api/teams/${id}`)
}

export function fetchTeamMatches(id: number) {
  return getJson<TeamMatchesResponse>(`/api/teams/${id}/matches`)
}
