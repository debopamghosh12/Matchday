import type { CompetitionGroup } from '../lib/matches'
import { Crest } from './Crest'
import { MatchCard } from './MatchCard'

export function CompetitionSection({ group }: { group: CompetitionGroup }) {
  const { competition, matches } = group
  return (
    <section aria-labelledby={`comp-${competition.code}`}>
      <header className="mb-4 flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-md border-2 border-ink bg-white p-1">
          <Crest src={competition.emblem} name={competition.name} size={24} />
        </span>
        <h2 id={`comp-${competition.code}`} className="font-display text-3xl leading-none tracking-wide">
          {competition.name}
        </h2>
        <span className="rounded-sm bg-fg px-1.5 text-xs leading-5 font-bold text-bg tabular-nums">{matches.length}</span>
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </section>
  )
}
