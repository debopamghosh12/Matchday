import { useScorers } from '../../hooks/useStandings'
import { teamName } from '../../lib/matchActions'
import type { Competition, Scorer } from '../../types/football'
import { Crest } from '../Crest'
import { EmptyState, ErrorState } from '../States'
import { TeamLink } from '../TeamLink'
import { CompetitionPage } from './CompetitionPage'

const NUM = 'px-1 py-2.5 text-center tabular-nums sm:px-3'

/** Standard competition ranking on goals: 1, 2, 2, 4. */
function ranks(scorers: Scorer[]): number[] {
  return scorers.map((s) => scorers.findIndex((o) => o.goals === s.goals) + 1)
}

const dash = (n: number | null) => (n === null ? '–' : n)

function ScorersTable({ competition }: { competition: Competition }) {
  const { data, error, isPending, refetch } = useScorers(competition.code)
  if (isPending) {
    return <div className="h-96 animate-pulse rounded-md border-2 border-ink bg-surface shadow-poster" aria-busy aria-label="Loading scorers" />
  }
  if (!data) return <ErrorState error={error} onRetry={() => refetch()} />
  if (data.scorers.length === 0) return <EmptyState title="No goals yet" hint="Top scorers appear once the season gets going." />

  const rank = ranks(data.scorers)
  const noAssists = data.scorers.every((s) => s.assists === null)
  return (
    <div className="overflow-hidden rounded-md border-2 border-ink bg-surface shadow-poster">
      <table className="w-full table-fixed border-collapse text-sm">
        <caption className="sr-only">Top scorers, {competition.name}</caption>
        <thead className="bg-surface-2 text-xs font-bold uppercase">
          <tr>
            <th scope="col" className={`${NUM} w-10 pl-3 sm:w-14`}>
              <abbr title="Rank" className="no-underline">#</abbr>
            </th>
            <th scope="col" className="px-2 py-2.5 text-left sm:px-3">Player</th>
            <th scope="col" className="hidden px-2 py-2.5 text-left sm:table-cell sm:px-3">Team</th>
            <th scope="col" className={`${NUM} w-9 sm:w-16`}><abbr title="Goals" className="no-underline">G</abbr></th>
            <th scope="col" className={`${NUM} w-9 sm:w-16`}><abbr title="Assists" className="no-underline">A</abbr></th>
            <th scope="col" className={`${NUM} w-11 pr-3 sm:w-16`}><abbr title="Penalties scored" className="no-underline">Pen</abbr></th>
          </tr>
        </thead>
        <tbody>
          {data.scorers.map((s, i) => (
            <tr key={s.player.id} className="border-t border-line">
              <td className={`${NUM} pl-3 font-bold`}>{rank[i]}</td>
              <td className="px-2 py-2.5 sm:px-3">
                <span className="block truncate font-semibold">{s.player.name}</span>
                {/* Team under the name on phones, where the team column is hidden. */}
                <TeamLink team={s.team} className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted sm:hidden">
                  <Crest src={s.team.crest} name={teamName(s.team)} size={14} />
                  <span className="truncate">{teamName(s.team)}</span>
                </TeamLink>
              </td>
              <td className="hidden px-2 py-2.5 sm:table-cell sm:px-3">
                <TeamLink team={s.team} className="flex min-w-0 items-center gap-2">
                  <Crest src={s.team.crest} name={teamName(s.team)} size={20} />
                  <span className="truncate">{teamName(s.team)}</span>
                </TeamLink>
              </td>
              <td className={`${NUM} font-display text-xl leading-none`}>{s.goals}</td>
              <td className={NUM}>{dash(s.assists)}</td>
              <td className={`${NUM} pr-3`}>{dash(s.penalties)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {noAssists && (
        <p className="border-t-2 border-ink px-3 py-2 text-xs text-muted">
          The data provider hasn't published assists for this competition yet.
        </p>
      )}
    </div>
  )
}

export function ScorersView() {
  return (
    <CompetitionPage title="Top Scorers" basePath="/scorers" tabsLabel="Competition scorers">
      {(competition) => <ScorersTable key={competition.code} competition={competition} />}
    </CompetitionPage>
  )
}
