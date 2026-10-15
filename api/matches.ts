// GET /api/matches?from=YYYY-MM-DD&to=YYYY-MM-DD
// `from` and `to` are IST calendar dates (inclusive). Returns every match whose
// kick-off falls on those IST dates, across all free-tier competitions.

import type { Match, MatchesResponse } from '../src/types/football.js'
import { cacheGet, cacheSet } from './_lib/cache.js'
import { addDays, chunkRange, diffDays, isValidDate, istDateOf, todayIST } from './_lib/dates.js'
import { FREE_COMPETITIONS, MAX_RANGE_DAYS, UpstreamError, fetchFootballData } from './_lib/footballData.js'
import { cacheControl, errorResponse, json } from './_lib/http.js'

const MAX_SPAN_DAYS = 62 // enough for a 6-week month grid
const LIVE_TTL = 60 // ranges touching today
const FIXTURE_TTL = 600 // everything else

interface UpstreamMatches {
  matches: Match[]
}

/** True if the UTC date window can contain matches on today's IST date. */
function touchesToday(utcFrom: string, utcTo: string): boolean {
  const today = todayIST()
  // IST "today" spans UTC (today - 1) 18:30 to today 18:29.
  return diffDays(utcFrom, today) >= 0 && diffDays(addDays(today, -1), utcTo) >= 0
}

/** Fetch matches for the inclusive UTC date range [utcFrom, utcTo]. */
async function fetchChunk(utcFrom: string, utcTo: string): Promise<Match[]> {
  const key = `matches:${utcFrom}:${utcTo}`
  const cached = cacheGet<Match[]>(key)
  if (cached) return cached

  const params = new URLSearchParams({
    dateFrom: utcFrom,
    // Upstream dateTo is exclusive (verified: dateFrom=dateTo returns nothing),
    // so ask for the day after the last day we want.
    dateTo: addDays(utcTo, 1),
    competitions: FREE_COMPETITIONS.join(','),
  })
  try {
    const data = await fetchFootballData<UpstreamMatches>(`/matches?${params}`)
    cacheSet(key, data.matches, touchesToday(utcFrom, utcTo) ? LIVE_TTL : FIXTURE_TTL)
    return data.matches
  } catch (err) {
    // Rate limited or upstream down: fall back to a stale copy if this instance has one.
    const stale = cacheGet<Match[]>(key, { allowStale: true })
    if (stale && err instanceof UpstreamError) return stale
    throw err
  }
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to') ?? from

  if (!isValidDate(from) || !isValidDate(to)) {
    return json({ error: 'from and to must be dates in YYYY-MM-DD format', status: 400 }, 400)
  }
  const span = diffDays(from, to) + 1
  if (span < 1 || span > MAX_SPAN_DAYS) {
    return json({ error: `Range must be 1-${MAX_SPAN_DAYS} days with from <= to`, status: 400 }, 400)
  }

  // An IST date starts at 18:30 UTC on the previous day, so widen the UTC
  // window by one day at the start and filter back down to IST dates below.
  const utcFrom = addDays(from, -1)
  const utcTo = to

  try {
    const chunks = chunkRange(utcFrom, utcTo, MAX_RANGE_DAYS)
    const results = await Promise.all(chunks.map(([a, b]) => fetchChunk(a, b)))

    const seen = new Set<number>()
    const matches = results
      .flat()
      .filter((m) => {
        if (seen.has(m.id)) return false
        seen.add(m.id)
        const day = istDateOf(m.utcDate)
        return day >= from && day <= to
      })
      .sort((a, b) => a.utcDate.localeCompare(b.utcDate))

    const body: MatchesResponse = {
      from,
      to,
      competitions: [...FREE_COMPETITIONS],
      matches,
      fetchedAt: new Date().toISOString(),
    }
    const live = touchesToday(utcFrom, utcTo)
    return json(body, 200, {
      'Cache-Control': live ? cacheControl(LIVE_TTL, LIVE_TTL) : cacheControl(FIXTURE_TTL, FIXTURE_TTL * 3),
    })
  } catch (err) {
    return errorResponse(err)
  }
}
