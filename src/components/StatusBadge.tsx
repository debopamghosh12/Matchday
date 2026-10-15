import type { MatchStatus } from '../types/football'
import { statusKind, statusLabel } from '../lib/matches'

// Flat print-style chips; every text/fill pair here is at least 4.5:1 in both themes.
const STYLES = {
  scheduled: 'border-line bg-surface-2 text-fg',
  live: 'border-ink bg-live text-ink',
  finished: 'border-fg bg-fg text-bg',
  postponed: 'border-ink bg-gold text-ink',
} as const

export function StatusBadge({ status }: { status: MatchStatus }) {
  const kind = statusKind(status)
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STYLES[kind]}`}
    >
      {kind === 'live' && <span className="size-1.5 animate-pulse rounded-full bg-ink" aria-hidden />}
      {statusLabel(status)}
    </span>
  )
}
