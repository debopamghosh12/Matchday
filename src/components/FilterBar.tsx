import type { ReactNode } from 'react'
import { useCompetitions } from '../hooks/useCompetitions'
import { useMatchFilters } from '../hooks/useMatchFilters'
import { competitionName } from '../lib/matches'
import { Crest } from './Crest'
import { MoonIcon } from './icons'

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`flex h-8 shrink-0 items-center gap-1.5 rounded-md border-2 px-2.5 text-xs font-bold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight ${
        pressed ? 'border-ink bg-accent text-accent-fg shadow-poster-sm' : 'border-ink bg-surface hover:bg-surface-2'
      }`}
    >
      {children}
    </button>
  )
}

/** League chips (multi-select) and the late-night toggle. Saved in localStorage. */
export function FilterBar() {
  const { filters, toggleLeague, clearLeagues, toggleLateNight } = useMatchFilters()
  const { data: competitions } = useCompetitions()

  return (
    <div
      role="group"
      aria-label="Filter matches"
      className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
    >
      <Chip pressed={filters.lateNight} onClick={toggleLateNight}>
        <MoonIcon className="size-3.5" />
        Late night (11 PM – 3 AM IST)
      </Chip>
      <span className="mx-1 w-0.5 shrink-0 self-stretch bg-ink/30" aria-hidden />
      <Chip pressed={filters.leagues.length === 0} onClick={clearLeagues}>
        All leagues
      </Chip>
      {competitions?.map((c) => (
        <Chip key={c.code} pressed={filters.leagues.includes(c.code)} onClick={() => toggleLeague(c.code)}>
          <span className="flex size-5 items-center justify-center rounded-sm bg-white p-0.5">
            <Crest src={c.emblem} name={c.name} size={16} />
          </span>
          {competitionName(c)}
        </Chip>
      ))}
    </div>
  )
}
