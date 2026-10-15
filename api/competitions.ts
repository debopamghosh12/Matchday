// GET /api/competitions
// The free-tier competitions (name, code, emblem) that /api/matches covers.

import type { Competition, CompetitionsResponse } from '../src/types/football.js'
import { cacheGet, cacheSet } from './_lib/cache.js'
import { FREE_COMPETITIONS, fetchFootballData } from './_lib/footballData.js'
import { cacheControl, errorResponse, json } from './_lib/http.js'

const TTL = 24 * 60 * 60

export async function GET(): Promise<Response> {
  try {
    let competitions = cacheGet<Competition[]>('competitions')
    if (!competitions) {
      const data = await fetchFootballData<{ competitions: Competition[] }>('/competitions')
      const allowed = new Set<string>(FREE_COMPETITIONS)
      competitions = data.competitions.filter((c) => allowed.has(c.code))
      cacheSet('competitions', competitions, TTL)
    }
    const body: CompetitionsResponse = { competitions }
    return json(body, 200, { 'Cache-Control': cacheControl(TTL, TTL * 7) })
  } catch (err) {
    return errorResponse(err)
  }
}
