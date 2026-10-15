// GET /api/teams/:id/matches
// A team's matches from 30 days ago to 60 days ahead (IST dates), in one upstream
// call. The window is fixed server-side so every visitor shares the same cache entry.

import type { Match, TeamMatchesResponse } from '../../../src/types/football.js'
import { cachedFetch } from '../../_lib/cachedFetch.js'
import { addDays, todayIST } from '../../_lib/dates.js'
import { cacheControl, errorResponse, json } from '../../_lib/http.js'
import { isPositiveInt, pathSegments } from '../../_lib/params.js'

const TTL = 10 * 60
const DAYS_BACK = 30
const DAYS_AHEAD = 60

export async function GET(request: Request): Promise<Response> {
  const id = pathSegments(request)[1]
  if (!isPositiveInt(id)) return json({ error: 'Team id must be a positive integer', status: 400 }, 400)

  const today = todayIST()
  const from = addDays(today, -DAYS_BACK)
  const to = addDays(today, DAYS_AHEAD)
  // Upstream dateTo is exclusive (as on /matches), hence the extra day.
  const params = new URLSearchParams({ dateFrom: from, dateTo: addDays(to, 1) })

  try {
    const data = await cachedFetch<{ matches: Match[] }>(`team-matches:${id}:${from}`, `/teams/${id}/matches?${params}`, TTL)
    const body: TeamMatchesResponse = {
      teamId: Number(id),
      from,
      to,
      matches: [...data.matches].sort((a, b) => a.utcDate.localeCompare(b.utcDate)),
      fetchedAt: new Date().toISOString(),
    }
    return json(body, 200, { 'Cache-Control': cacheControl(TTL, TTL * 3) })
  } catch (err) {
    return errorResponse(err)
  }
}
