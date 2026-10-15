import { useQuery } from '@tanstack/react-query'
import { fetchCompetitions } from '../lib/api'
import { competitionRank } from '../lib/matches'

/** The competitions our key can access (server-cached for a day). */
export function useCompetitions() {
  return useQuery({
    queryKey: ['competitions'],
    queryFn: () => fetchCompetitions(),
    staleTime: 24 * 60 * 60_000,
    gcTime: Infinity,
    select: (data) => [...data.competitions].sort((a, b) => competitionRank(a.code) - competitionRank(b.code)),
  })
}
