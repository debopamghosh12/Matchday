import { useMemo } from 'react'
import { createStoredState } from '../lib/storedState'
import { isLateNight } from '../lib/time'
import type { Match } from '../types/football'

export interface MatchFilters {
  /** Competition codes to show; empty means all. */
  leagues: string[]
  lateNight: boolean
}

const filtersStore = createStoredState<MatchFilters>('matchday:filters', { leagues: [], lateNight: false }, (raw) => {
  const r = raw as Partial<MatchFilters> | null
  if (!r || typeof r !== 'object') return undefined
  return {
    leagues: Array.isArray(r.leagues) ? r.leagues.filter((c): c is string => typeof c === 'string') : [],
    lateNight: r.lateNight === true,
  }
})

export function matchesFilter(filters: MatchFilters, match: Match): boolean {
  if (filters.leagues.length > 0 && !filters.leagues.includes(match.competition.code)) return false
  if (filters.lateNight && !isLateNight(match.utcDate)) return false
  return true
}

/** League + late-night filters, saved in localStorage and shared across the page. */
export function useMatchFilters() {
  const filters = filtersStore.use()
  return useMemo(
    () => ({
      filters,
      isActive: filters.leagues.length > 0 || filters.lateNight,
      predicate: (m: Match) => matchesFilter(filters, m),
      toggleLeague: (code: string) =>
        filtersStore.set((f) => ({
          ...f,
          leagues: f.leagues.includes(code) ? f.leagues.filter((c) => c !== code) : [...f.leagues, code],
        })),
      clearLeagues: () => filtersStore.set((f) => ({ ...f, leagues: [] })),
      toggleLateNight: () => filtersStore.set((f) => ({ ...f, lateNight: !f.lateNight })),
    }),
    [filters],
  )
}
