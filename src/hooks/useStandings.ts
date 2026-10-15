import { useQuery } from '@tanstack/react-query'
import { fetchScorers, fetchStandings } from '../lib/api'

// Match the server TTLs: standings 15 min, scorers 30 min. Never refetched on
// window focus (the client default), so switching tabs back and forth is free.

export function useStandings(code: string) {
  return useQuery({
    queryKey: ['standings', code],
    queryFn: () => fetchStandings(code),
    staleTime: 15 * 60_000,
  })
}

export function useScorers(code: string) {
  return useQuery({
    queryKey: ['scorers', code],
    queryFn: () => fetchScorers(code),
    staleTime: 30 * 60_000,
  })
}
