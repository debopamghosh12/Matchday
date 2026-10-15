import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchMatches } from '../lib/api'
import { todayIST } from '../lib/time'

const TODAY_STALE_MS = 60_000
const FIXTURES_STALE_MS = 10 * 60_000

/**
 * Matches whose IST kick-off date falls in [from, to] (inclusive).
 * Ranges containing today are refreshed every 60s while the page is open and
 * on window focus; other ranges stay fresh for 10 minutes and never refetch on
 * focus, so browsing around doesn't eat into the API rate limit.
 */
export function useMatches(from: string, to: string) {
  const today = todayIST()
  const includesToday = from <= today && today <= to

  return useQuery({
    queryKey: ['matches', from, to],
    // No abort signal: cancelling a request the server is already handling
    // saves no upstream quota, and it makes StrictMode/fast navigation refire.
    queryFn: () => fetchMatches(from, to),
    staleTime: includesToday ? TODAY_STALE_MS : FIXTURES_STALE_MS,
    refetchInterval: includesToday ? TODAY_STALE_MS : false,
    refetchOnWindowFocus: includesToday,
    placeholderData: keepPreviousData,
  })
}
