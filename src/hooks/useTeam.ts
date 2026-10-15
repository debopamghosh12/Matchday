import { useQuery } from '@tanstack/react-query'
import { fetchTeam, fetchTeamMatches } from '../lib/api'

// Match the server TTLs: team info 24h, team matches 10 min.

export function useTeam(id: number) {
  return useQuery({
    queryKey: ['team', id],
    queryFn: () => fetchTeam(id),
    staleTime: 24 * 60 * 60_000,
  })
}

export function useTeamMatches(id: number) {
  return useQuery({
    queryKey: ['team-matches', id],
    queryFn: () => fetchTeamMatches(id),
    staleTime: 10 * 60_000,
  })
}
