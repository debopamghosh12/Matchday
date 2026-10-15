import { useMemo } from 'react'
import { formatInTimeZone } from 'date-fns-tz'
import { useDayMatches } from '../../hooks/useDayMatches'
import { groupByCompetition } from '../../lib/matches'
import { IST_TZ } from '../../lib/time'
import { CompetitionSection } from '../CompetitionSection'
import { EmptyState, ErrorState, MatchListSkeleton } from '../States'

/** All matches on one IST date, grouped by competition. */
export function DayView({ date }: { date: string }) {
  const { matches, data, error, isPending, isError, isFetching, isStale, dataUpdatedAt, refetch, isLive } =
    useDayMatches(date)
  const isToday = isLive

  const groups = useMemo(() => groupByCompetition(matches), [matches])

  return (
    <div>
      {/* The page title lives in the hero; this row just reports freshness on today's list. */}
      {isToday && dataUpdatedAt > 0 && (
        <p className="-mt-2 mb-4 flex items-center gap-1.5 text-xs text-muted" aria-live="polite">
          <span className={`size-1.5 rounded-full ${isFetching ? 'animate-pulse bg-accent' : 'bg-accent/60'}`} />
          {isFetching ? 'Updating…' : `Updated ${formatInTimeZone(dataUpdatedAt, IST_TZ, 'h:mm a')} · auto-refreshes every minute`}
        </p>
      )}

      {isPending || isStale ? (
        <MatchListSkeleton />
      ) : isError && !data ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : groups.length === 0 ? (
        <EmptyState
          title={isToday ? 'No matches today' : 'No matches on this day'}
          hint="Try another date, or check the week view for upcoming fixtures."
        />
      ) : (
        <div className="space-y-10">
          {groups.map((g) => (
            <CompetitionSection key={g.competition.code} group={g} />
          ))}
        </div>
      )}
    </div>
  )
}
