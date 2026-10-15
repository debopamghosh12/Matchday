import type { Match, TeamRef } from '../types/football'
import { hasScore, stageLabel, statusKind } from '../lib/matches'
import { formatKickoff } from '../lib/time'
import { Crest } from './Crest'
import { StatusBadge } from './StatusBadge'

interface MatchCardProps {
  match: Match
  /** Show the competition emblem + name (when not already grouped by it). */
  showCompetition?: boolean
}

function teamName(team: TeamRef): string {
  return team.shortName || team.name || 'TBD'
}

function TeamRow({ team, goals, dimmed }: { team: TeamRef; goals: number | null; dimmed: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${dimmed ? 'text-muted' : ''}`}>
      <Crest src={team.crest} name={teamName(team)} size={22} />
      <span className="min-w-0 flex-1 truncate font-medium" title={team.name ?? undefined}>
        {teamName(team)}
      </span>
      {goals !== null && <span className="w-6 text-right font-display text-2xl leading-none tabular-nums">{goals}</span>}
    </div>
  )
}

export function MatchCard({ match, showCompetition = false }: MatchCardProps) {
  const kind = statusKind(match.status)
  const scored = hasScore(match)
  const { home, away } = match.score.fullTime
  const winner = kind === 'finished' ? match.score.winner : null
  const meta = [showCompetition ? match.competition.name : '', stageLabel(match), match.venue ?? '']
    .filter(Boolean)
    .join(' · ')

  return (
    <article
      className={`rounded-md border-2 border-ink bg-surface p-3 sm:p-4 ${
        kind === 'live' ? 'shadow-poster-live' : 'shadow-poster'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <time dateTime={match.utcDate} className="text-sm font-semibold tabular-nums">
          {formatKickoff(match.utcDate)}
        </time>
        <StatusBadge status={match.status} />
      </div>

      <div className="mt-3 space-y-2">
        <TeamRow team={match.homeTeam} goals={scored ? home : null} dimmed={winner === 'AWAY_TEAM'} />
        <TeamRow team={match.awayTeam} goals={scored ? away : null} dimmed={winner === 'HOME_TEAM'} />
      </div>

      {meta && (
        <p className="mt-3 flex items-center gap-1.5 truncate text-xs text-muted">
          {showCompetition && <Crest src={match.competition.emblem} name={match.competition.name} size={14} />}
          {meta}
        </p>
      )}
    </article>
  )
}
