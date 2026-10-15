// GET /api/scorers/:code
// Top 20 scorers for one competition.

import type { CompetitionRef, Scorer, ScorersResponse, Season } from '../../src/types/football.js'
import { cachedFetch } from '../_lib/cachedFetch.js'
import { cacheControl, errorResponse, json } from '../_lib/http.js'
import { competitionCode, pathSegments } from '../_lib/params.js'

const TTL = 30 * 60

interface UpstreamScorers {
  competition: CompetitionRef
  season: Season
  scorers: Scorer[]
}

export async function GET(request: Request): Promise<Response> {
  const code = competitionCode(pathSegments(request)[1])
  if (!code) return json({ error: 'Unknown or unavailable competition code', status: 400 }, 400)

  try {
    const data = await cachedFetch<UpstreamScorers>(`scorers:${code}`, `/competitions/${code}/scorers?limit=20`, TTL)
    const body: ScorersResponse = {
      competition: data.competition,
      season: data.season,
      // Keep only what the page shows (upstream player/team objects are large).
      scorers: data.scorers.map((s) => ({
        player: { id: s.player.id, name: s.player.name, nationality: s.player.nationality ?? null },
        team: { id: s.team.id, name: s.team.name, shortName: s.team.shortName, tla: s.team.tla, crest: s.team.crest },
        playedMatches: s.playedMatches ?? null,
        goals: s.goals,
        assists: s.assists ?? null,
        penalties: s.penalties ?? null,
      })),
      fetchedAt: new Date().toISOString(),
    }
    return json(body, 200, { 'Cache-Control': cacheControl(TTL, TTL * 2) })
  } catch (err) {
    return errorResponse(err)
  }
}
