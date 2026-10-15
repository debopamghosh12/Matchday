import type { CompetitionGroup } from '../lib/matches'
import { Crest } from './Crest'
import { MatchCard } from './MatchCard'

export function CompetitionSection({ group }: { group: CompetitionGroup }) {
  const { competition, matches } = group
  return (
    <section aria-labelledby={`comp-${competition.code}`}>
      <header className="mb-3 flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-white p-1 shadow-sm">
          <Crest src={competition.emblem} name={competition.name} size={24} />
        </span>
        <h2 id={`comp-${competition.code}`} className="text-base font-semibold">
          {competition.name}
        </h2>
        <span className="text-sm text-muted">{matches.length}</span>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </section>
  )
}
