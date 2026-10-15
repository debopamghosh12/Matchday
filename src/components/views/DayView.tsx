import { useMemo } from 'react'
import { formatInTimeZone } from 'date-fns-tz'
import { useDayMatches } from '../../hooks/useDayMatches'
import { groupByCompetition } from '../../lib/matches'
import { formatDateKey, IST_TZ } from '../../lib/time'
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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{isToday ? 'Today' : formatDateKey(date, 'EEEE')}</h1>
          <p className="mt-0.5 text-sm text-muted">{formatDateKey(date, 'EEEE, d MMMM yyyy')} · times in IST</p>
        </div>
        {isToday && dataUpdatedAt > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-muted" aria-live="polite">
            <span className={`size-1.5 rounded-full ${isFetching ? 'animate-pulse bg-accent' : 'bg-accent/50'}`} />
            {isFetching ? 'Updating…' : `Updated ${formatInTimeZone(dataUpdatedAt, IST_TZ, 'h:mm a')} · auto-refreshes every minute`}
          </p>
        )}
      </div>

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
