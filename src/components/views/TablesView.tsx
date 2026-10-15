import { useStandings } from '../../hooks/useStandings'
import { teamName } from '../../lib/matchActions'
import { legendFor, zoneAt, zonesFor, ZONE_BG, type Zone } from '../../lib/zones'
import type { Competition, StandingTable } from '../../types/football'
import { Crest } from '../Crest'
import { FormPills } from '../FormPills'
import { EmptyState, ErrorState } from '../States'
import { TeamLink } from '../TeamLink'
import { CompetitionPage } from './CompetitionPage'

const NUM = 'px-1 py-2 text-center tabular-nums sm:px-2'
const WDL = `${NUM} hidden sm:table-cell`

function Legend({ zones }: { zones: Zone[] }) {
  if (zones.length === 0) return null
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-semibold" aria-label="Table zones">
      {legendFor(zones).map((zone) => (
        <li key={zone.label} className="flex items-center gap-1.5">
          <span className={`h-3 w-1.5 rounded-sm ${ZONE_BG[zone.tone]}`} aria-hidden />
          {zone.label}
        </li>
      ))}
    </ul>
  )
}

function Table({ table, code, caption }: { table: StandingTable; code: string; caption: string }) {
  const zones = zonesFor(code, table.stage)
  return (
    <section>
      <div className="overflow-hidden rounded-md border-2 border-ink bg-surface shadow-poster">
        <table className="w-full table-fixed border-collapse text-sm">
          <caption className="border-b-2 border-ink px-3 py-2 text-left font-display text-2xl tracking-wide">{caption}</caption>
          <thead className="bg-surface-2 text-xs font-bold uppercase">
            <tr>
              <th scope="col" className={`${NUM} w-8 pl-2 sm:w-12 sm:pl-3`}>
                <abbr title="Position" className="no-underline">#</abbr>
              </th>
              <th scope="col" className="px-1.5 py-2 text-left sm:px-2">Team</th>
              <th scope="col" className={`${NUM} w-7 sm:w-12`}><abbr title="Played" className="no-underline">P</abbr></th>
              <th scope="col" className={`${WDL} sm:w-12`}><abbr title="Won" className="no-underline">W</abbr></th>
              <th scope="col" className={`${WDL} sm:w-12`}><abbr title="Drawn" className="no-underline">D</abbr></th>
              <th scope="col" className={`${WDL} sm:w-12`}><abbr title="Lost" className="no-underline">L</abbr></th>
              <th scope="col" className={`${NUM} w-9 sm:w-14`}><abbr title="Goal difference" className="no-underline">GD</abbr></th>
              <th scope="col" className={`${NUM} w-9 sm:w-14`}><abbr title="Points" className="no-underline">Pts</abbr></th>
              <th scope="col" className="w-[94px] px-1 py-2 pr-2 text-left sm:w-36 sm:px-2">Form</th>
            </tr>
          </thead>
          <tbody>
            {table.table.map((row) => {
              const zone = zoneAt(zones, row.position)
              return (
                <tr key={row.team.id ?? row.position} className="border-t border-line">
                  <td className={`${NUM} relative pl-2 font-bold sm:pl-3`}>
                    {zone && <span className={`absolute inset-y-0 left-0 w-1.5 ${ZONE_BG[zone.tone]}`} aria-hidden />}
                    {row.position}
                    {zone && <span className="sr-only">, {zone.label}</span>}
                  </td>
                  <td className="px-1.5 py-2 sm:px-2">
                    <TeamLink team={row.team} className="flex min-w-0 items-center gap-1.5 font-semibold sm:gap-2">
                      <Crest src={row.team.crest} name={teamName(row.team)} size={20} />
                      <span className="truncate" title={row.team.name ?? undefined}>{teamName(row.team)}</span>
                    </TeamLink>
                  </td>
                  <td className={NUM}>{row.playedGames}</td>
                  <td className={WDL}>{row.won}</td>
                  <td className={WDL}>{row.draw}</td>
                  <td className={WDL}>{row.lost}</td>
                  <td className={NUM}>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                  <td className={`${NUM} font-bold`}>{row.points}</td>
                  <td className="px-1 py-2 pr-2 sm:px-2">
                    <FormPills form={row.form} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <Legend zones={zones} />
    </section>
  )
}

function TableSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-md border-2 border-ink bg-surface shadow-poster" aria-busy aria-label="Loading table">
      <div className="h-11 border-b-2 border-ink" />
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 border-t border-line px-3 py-2.5">
          <div className="h-4 w-5 rounded bg-surface-2" />
          <div className="size-5 rounded-full bg-surface-2" />
          <div className="h-4 flex-1 rounded bg-surface-2" />
          <div className="h-4 w-24 rounded bg-surface-2" />
        </div>
      ))}
    </div>
  )
}

function captionFor(table: StandingTable, competition: Competition, count: number): string {
  // Single league tables come back with a placeholder group ("Matchday"); use the competition name.
  if (count === 1 && table.stage === 'REGULAR_SEASON') return 'Table'
  return table.group ? table.group.replace(/^GROUP_/, 'Group ') : competition.name
}

function Standings({ competition }: { competition: Competition }) {
  const { data, error, isPending, refetch } = useStandings(competition.code)
  if (isPending) return <TableSkeleton />
  if (!data) return <ErrorState error={error} onRetry={() => refetch()} />
  if (data.standings.length === 0) {
    return <EmptyState title="No table yet" hint="This competition hasn't published standings for the current stage." />
  }
  return (
    <div className="space-y-8">
      {data.standings.map((table, i) => (
        <Table
          key={`${table.stage}-${table.group ?? i}`}
          table={table}
          code={competition.code}
          caption={captionFor(table, competition, data.standings.length)}
        />
      ))}
      {data.formSource === 'unavailable' && (
        <p className="text-xs text-muted">Recent form is temporarily unavailable (data provider rate limit). It will fill in shortly.</p>
      )}
    </div>
  )
}

export function TablesView() {
  return (
    <CompetitionPage title="League Tables" basePath="/tables" tabsLabel="Competition tables">
      {(competition) => <Standings key={competition.code} competition={competition} />}
    </CompetitionPage>
  )
}
