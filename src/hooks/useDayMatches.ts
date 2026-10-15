import { useMemo } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { istDateKey, todayIST } from '../lib/time'
import { useMatches } from './useMatches'

/**
 * The [from, to] of a cached multi-day matches query that covers `date`
 * (e.g. one the date slider loaded), preferring ones that already have data.
 */
function findCoveringRange(client: QueryClient, date: string): [string, string] | null {
  const queries = client.getQueryCache().findAll({ queryKey: ['matches'] })
  let pending: [string, string] | null = null
  for (const query of queries) {
    const [, from, to] = query.queryKey as [string, string, string]
    if (from === to || date < from || date > to) continue
    if (query.state.data) return [from, to]
    pending ??= [from, to]
  }
  return pending
}

/**
 * Matches on one IST date. Today always gets its own small live query
 * (auto-refresh every 60s). Other days reuse any cached range that covers
 * them, so hopping between days in the slider costs no extra requests;
 * otherwise the single day is fetched.
 */
export function useDayMatches(date: string) {
  const client = useQueryClient()
  const isToday = date === todayIST()
  const [from, to] = (!isToday && findCoveringRange(client, date)) || [date, date]

  const query = useMatches(from, to, { live: isToday })
  const data = query.data
  const isOtherRange = data !== undefined && (data.from !== from || data.to !== to)

  const matches = useMemo(
    () => (data ? data.matches.filter((m) => istDateKey(m.utcDate) === date) : []),
    [data, date],
  )

  return {
    ...query,
    matches,
    isLive: isToday,
    /** Data on screen belongs to a previous range (keepPreviousData). */
    isStale: isOtherRange,
  }
}
