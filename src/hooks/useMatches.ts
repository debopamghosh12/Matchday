import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import { fetchMatches } from '../lib/api'
import { todayIST } from '../lib/time'

const LIVE_STALE_MS = 60_000
const FIXTURES_STALE_MS = 10 * 60_000

export function matchesQueryKey(from: string, to: string) {
  return ['matches', from, to] as const
}

/** Shared query options so every consumer of a range uses the same cache entry and timings. */
export function matchesQueryOptions(from: string, to: string, live: boolean) {
  return queryOptions({
    queryKey: matchesQueryKey(from, to),
    // No abort signal: cancelling a request the server is already handling
    // saves no upstream quota, and it makes StrictMode/fast navigation refire.
    queryFn: () => fetchMatches(from, to),
    staleTime: live ? LIVE_STALE_MS : FIXTURES_STALE_MS,
    refetchInterval: live ? LIVE_STALE_MS : false,
    refetchOnWindowFocus: live,
  })
}

interface UseMatchesOptions {
  /**
   * Auto-refresh every 60s and on window focus. Defaults to true when the
   * range contains today. Wide ranges (like the date slider's) pass false so
   * they don't re-fetch many days every minute just because today is in them.
   */
  live?: boolean
}

/**
 * Matches whose IST kick-off date falls in [from, to] (inclusive).
 * Live queries stay fresh for 60s and auto-refresh while the page is open;
 * others stay fresh for 10 minutes and never refetch on focus, so browsing
 * around doesn't eat into the API rate limit.
 */
export function useMatches(from: string, to: string, { live }: UseMatchesOptions = {}) {
  const today = todayIST()
  const isLive = live ?? (from <= today && today <= to)

  return useQuery({ ...matchesQueryOptions(from, to, isLive), placeholderData: keepPreviousData })
}
