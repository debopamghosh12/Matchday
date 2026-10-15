import { NavLink } from 'react-router-dom'
import type { Competition } from '../types/football'
import { competitionName } from '../lib/matches'
import { Crest } from './Crest'

interface CompetitionTabsProps {
  competitions: Competition[]
  /** Route prefix, e.g. "/tables" -> links to /tables/PL. */
  basePath: string
  label: string
}

/** One link per competition; the current one is marked with aria-current. */
export function CompetitionTabs({ competitions, basePath, label }: CompetitionTabsProps) {
  return (
    <nav aria-label={label} className="no-scrollbar -mx-4 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0">
      <ul className="flex gap-2 sm:flex-wrap">
        {competitions.map((c) => (
          <li key={c.code} className="shrink-0">
            <NavLink
              to={`${basePath}/${c.code}`}
              className={({ isActive }) =>
                `flex h-9 items-center gap-1.5 rounded-md border-2 border-ink px-2.5 text-sm font-bold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight ${
                  isActive ? 'bg-accent text-accent-fg shadow-poster-sm' : 'bg-surface hover:bg-surface-2'
                }`
              }
            >
              <span className="flex size-5 items-center justify-center rounded-sm bg-white p-0.5">
                <Crest src={c.emblem} name={c.name} size={16} />
              </span>
              {competitionName(c)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
