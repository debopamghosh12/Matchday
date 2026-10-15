import type { FormResult, Match } from '../../src/types/football.js'

/** "W,D,L" (as the paid tiers send it) -> ['W', 'D', 'L']. */
export function parseForm(form: string | null): FormResult[] | null {
  if (!form) return null
  const results = form.split(',').filter((r): r is FormResult => r === 'W' || r === 'D' || r === 'L')
  return results.length ? results : null
}

/** A team's result in a finished match, or null if it didn't play / no score. */
export function resultFor(match: Match, teamId: number): FormResult | null {
  const { home, away } = match.score.fullTime
  if (match.status !== 'FINISHED' || home === null || away === null) return null
  const isHome = match.homeTeam.id === teamId
  if (!isHome && match.awayTeam.id !== teamId) return null
  if (home === away) return 'D'
  return home > away === isHome ? 'W' : 'L'
}

/** Last `count` results per team id, oldest first, from finished matches. */
export function formFromMatches(matches: Match[], count = 5): Map<number, FormResult[]> {
  const byTeam = new Map<number, FormResult[]>()
  const finished = [...matches].sort((a, b) => a.utcDate.localeCompare(b.utcDate))
  for (const match of finished) {
    for (const team of [match.homeTeam, match.awayTeam]) {
      if (team.id === null) continue
      const result = resultFor(match, team.id)
      if (!result) continue
      const list = byTeam.get(team.id) ?? []
      list.push(result)
      byTeam.set(team.id, list)
    }
  }
  for (const [id, list] of byTeam) byTeam.set(id, list.slice(-count))
  return byTeam
}
