import { useMemo } from 'react'
import { createStoredState } from '../lib/storedState'
import type { TeamRef } from '../types/football'

/** What we keep about a followed team: enough to show it without a request. */
export interface FollowedTeam {
  id: number
  name: string
  shortName: string | null
  crest: string | null
}

const store = createStoredState<FollowedTeam[]>('matchday:favourites', [], (raw) => {
  if (!Array.isArray(raw)) return undefined
  return raw.filter(
    (t): t is FollowedTeam => !!t && typeof t === 'object' && Number.isInteger(t.id) && typeof t.name === 'string',
  )
})

/** Followed teams, saved in localStorage and shared across the app (and tabs). */
export function useFavourites() {
  const teams = store.use()
  return useMemo(() => {
    const ids = new Set(teams.map((t) => t.id))
    return {
      teams,
      ids,
      isFollowing: (id: number | null) => id !== null && ids.has(id),
      toggle: (team: Pick<TeamRef, 'id' | 'name' | 'shortName' | 'crest'>) => {
        if (team.id === null) return
        const id = team.id
        store.set((list) =>
          list.some((t) => t.id === id)
            ? list.filter((t) => t.id !== id)
            : [...list, { id, name: team.name ?? team.shortName ?? 'Team', shortName: team.shortName, crest: team.crest }],
        )
      },
    }
  }, [teams])
}
