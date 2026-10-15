// GET /api/standings/:code
// League tables (TOTAL only) for one competition. The free tier sends `form: null`,
// so we derive each team's last five results from the competition's finished
// matches (one extra upstream call, cached on the same 15-minute TTL).

import type {
  CompetitionRef,
  FormResult,
  Match,
  Season,
  StandingRow,
  StandingTable,
  StandingsResponse,
} from '../../src/types/football.js'
import { cachedFetch } from '../_lib/cachedFetch.js'
import { formFromMatches, parseForm } from '../_lib/form.js'
import { cacheControl, errorResponse, json } from '../_lib/http.js'
import { competitionCode, pathSegments } from '../_lib/params.js'

const TTL = 15 * 60

interface UpstreamStandings {
  competition: CompetitionRef
  season: Season
  standings: (Omit<StandingTable, 'table'> & { table: (Omit<StandingRow, 'form'> & { form: string | null })[] })[]
}

export async function GET(request: Request): Promise<Response> {
  const code = competitionCode(pathSegments(request)[1])
  if (!code) return json({ error: 'Unknown or unavailable competition code', status: 400 }, 400)

  try {
    const data = await cachedFetch<UpstreamStandings>(`standings:${code}`, `/competitions/${code}/standings`, TTL)
    const totals = data.standings.filter((s) => s.type === 'TOTAL')
    const hasApiForm = totals.some((s) => s.table.some((r) => r.form))

    let computed: Map<number, FormResult[]> | null = null
    if (!hasApiForm) {
      try {
        const finished = await cachedFetch<{ matches: Match[] }>(
          `finished:${code}`,
          `/competitions/${code}/matches?status=FINISHED`,
          TTL,
        )
        computed = formFromMatches(finished.matches)
      } catch {
        // Rate limited or unavailable: still return the table, just without form.
      }
    }

    const formFor = (row: { team: { id: number | null }; form: string | null }): FormResult[] | null => {
      if (hasApiForm) return parseForm(row.form)
      if (!computed) return null
      return (row.team.id !== null && computed.get(row.team.id)) || []
    }

    const standings: StandingTable[] = totals.map((s) => ({
      stage: s.stage,
      type: s.type,
      group: s.group,
      table: s.table.map((row) => ({ ...row, form: formFor(row) })),
    }))

    const body: StandingsResponse = {
      competition: data.competition,
      season: data.season,
      standings,
      formSource: hasApiForm ? 'api' : computed ? 'computed' : 'unavailable',
      fetchedAt: new Date().toISOString(),
    }
    return json(body, 200, { 'Cache-Control': cacheControl(TTL, TTL * 2) })
  } catch (err) {
    return errorResponse(err)
  }
}
