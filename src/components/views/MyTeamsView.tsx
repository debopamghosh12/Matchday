import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useFavourites } from '../../hooks/useFavourites'
import { matchesQueryOptions } from '../../hooks/useMatches'
import { useNow } from '../../hooks/useNow'
import { useTodayIST } from '../../hooks/useTodayIST'
import { groupByIstDate, statusKind } from '../../lib/matches'
import { addDaysToKey, formatDateKey } from '../../lib/time'
import { Crest } from '../Crest'
import { MatchCard } from '../MatchCard'
import { PageHeading } from '../PageHeading'
import { EmptyState, ErrorState, MatchListSkeleton } from '../States'

// Same window as the date slider's initial load, so this page reuses its cached
// range (one /api/matches call for every followed team, however many there are).
const DAYS_BEFORE = 7
const DAYS_AFTER = 21

function dayHeading(date: string, today: string): string {
  if (date === today) return 'Today'
  if (date === addDaysToKey(today, 1)) return 'Tomorrow'
  return formatDateKey(date, 'EEEE d MMMM')
}

export function MyTeamsView() {
  const { teams, ids } = useFavourites()
  const today = useTodayIST()
  const now = useNow()
  const from = addDaysToKey(today, -DAYS_BEFORE)
  const to = addDaysToKey(today, DAYS_AFTER)
  const query = useQuery({ ...matchesQueryOptions(from, to, false), enabled: teams.length > 0 })

  const days = useMemo(() => {
    const upcoming = (query.data?.matches ?? []).filter(
      (m) =>
        (ids.has(m.homeTeam.id ?? -1) || ids.has(m.awayTeam.id ?? -1)) &&
        ['scheduled', 'live'].includes(statusKind(m.status)) &&
        // Keep matches that may still be in progress; drop stale "scheduled" ones from days ago.
        Date.parse(m.utcDate) > now - 3 * 60 * 60_000,
    )
    return [...groupByIstDate(upcoming).entries()]
  }, [query.data, ids, now])

  return (
    <main className="mx-auto max-w-6xl px-4 pb-10">
      <PageHeading title="My Teams" subtitle="Upcoming matches for the teams you follow · next 3 weeks · times in IST" />

      {teams.length === 0 ? (
        <EmptyState
          title="You're not following anyone yet"
          hint="Tap a team name on any match card, table or scorers list to open its page, then press Follow. Followed teams are saved on this device."
        />
      ) : (
        <>
          <ul className="mb-8 flex flex-wrap gap-2" aria-label="Followed teams">
            {teams.map((t) => (
              <li key={t.id}>
                <Link
                  to={`/team/${t.id}`}
                  className="flex h-9 items-center gap-2 rounded-md border-2 border-ink bg-surface px-2.5 text-sm font-bold hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight"
                >
                  <Crest src={t.crest} name={t.name} size={18} />
                  {t.shortName ?? t.name}
                </Link>
              </li>
            ))}
          </ul>

          {query.isPending ? (
            <MatchListSkeleton />
          ) : !query.data ? (
            <ErrorState error={query.error} onRetry={() => query.refetch()} />
          ) : days.length === 0 ? (
            <EmptyState title="No upcoming matches" hint="None of your teams play in the next 3 weeks in the competitions we cover." />
          ) : (
            <div className="space-y-10">
              {days.map(([date, matches]) => (
                <section key={date} aria-labelledby={`day-${date}`}>
                  <h2 id={`day-${date}`} className="mb-4 font-display text-3xl leading-none tracking-wide">
                    {dayHeading(date, today)}
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {matches.map((m) => (
                      <MatchCard key={m.id} match={m} showCompetition />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  )
}
