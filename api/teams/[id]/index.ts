// GET /api/teams/:id
// Club details for the team page (squad and staff dropped). Cached for a day.

import type { TeamDetails } from '../../../src/types/football.js'
import { cachedFetch } from '../../_lib/cachedFetch.js'
import { cacheControl, errorResponse, json } from '../../_lib/http.js'
import { isPositiveInt, pathSegments } from '../../_lib/params.js'

const TTL = 24 * 60 * 60

type UpstreamTeam = TeamDetails & { squad?: unknown; staff?: unknown; coach?: unknown }

export async function GET(request: Request): Promise<Response> {
  const id = pathSegments(request)[1]
  if (!isPositiveInt(id)) return json({ error: 'Team id must be a positive integer', status: 400 }, 400)

  try {
    const team = await cachedFetch<UpstreamTeam>(`team:${id}`, `/teams/${id}`, TTL)
    const body: TeamDetails = {
      id: team.id,
      name: team.name,
      shortName: team.shortName,
      tla: team.tla,
      crest: team.crest,
      area: team.area,
      venue: team.venue ?? null,
      founded: team.founded ?? null,
      clubColors: team.clubColors ?? null,
      website: team.website ?? null,
      runningCompetitions: (team.runningCompetitions ?? []).map(({ id, name, code, type, emblem }) => ({ id, name, code, type, emblem })),
    }
    return json(body, 200, { 'Cache-Control': cacheControl(TTL, TTL * 7) })
  } catch (err) {
    return errorResponse(err)
  }
}
