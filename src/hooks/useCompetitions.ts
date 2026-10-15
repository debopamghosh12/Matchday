import { useQuery } from '@tanstack/react-query'
import { fetchCompetitions } from '../lib/api'
import { competitionRank } from '../lib/matches'
import { todayIST } from '../lib/time'
import type { CompetitionsResponse } from '../types/football'

const sorted = (data: CompetitionsResponse) =>
  [...data.competitions].sort((a, b) => competitionRank(a.code) - competitionRank(b.code))

const competitionsQuery = {
  queryKey: ['competitions'],
  queryFn: () => fetchCompetitions(),
  staleTime: 24 * 60 * 60_000,
  gcTime: Infinity,
} as const

/** The competitions our key can access (server-cached for a day). */
export function useCompetitions() {
  return useQuery({ ...competitionsQuery, select: sorted })
}

/**
 * Competitions whose current season hasn't ended, i.e. the ones with live
 * standings/scorers (finished tournaments like a past World Cup return 404).
 */
export function useActiveCompetitions() {
  return useQuery({
    ...competitionsQuery,
    select: (data) => {
      const today = todayIST()
      return sorted(data).filter((c) => c.currentSeason && c.currentSeason.endDate >= today)
    },
  })
}
