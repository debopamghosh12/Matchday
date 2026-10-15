import type { MatchStatus } from '../types/football'
import { statusKind, statusLabel } from '../lib/matches'

const STYLES = {
  scheduled: 'bg-surface-2 text-muted',
  live: 'bg-live/15 text-live',
  finished: 'bg-accent/15 text-accent',
  postponed: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
} as const

export function StatusBadge({ status }: { status: MatchStatus }) {
  const kind = statusKind(status)
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STYLES[kind]}`}
    >
      {kind === 'live' && <span className="size-1.5 animate-pulse rounded-full bg-live" aria-hidden />}
      {statusLabel(status)}
    </span>
  )
}
