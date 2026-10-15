import type { ReactNode } from 'react'
import type { Match, TeamRef } from '../types/football'
import { useNow } from '../hooks/useNow'
import { formatCountdown } from '../lib/countdown'
import { downloadIcs } from '../lib/ics'
import { matchesCalendar, matchIcsFilename, teamName } from '../lib/matchActions'
import { competitionName, hasScore, stageLabel, statusKind } from '../lib/matches'
import { shareMatch } from '../lib/share'
import { formatKickoff, isLateNight } from '../lib/time'
import { showToast } from '../lib/toast'
import { Crest } from './Crest'
import { StatusBadge } from './StatusBadge'
import { CalendarIcon, MoonIcon, ShareIcon } from './icons'

interface MatchCardProps {
  match: Match
  /** Show the competition emblem + name (when not already grouped by it). */
  showCompetition?: boolean
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

/** "Starts in 2h 14m" from the page-wide 30s clock; "Kicking off" once the time has passed. */
function Countdown({ utcDate }: { utcDate: string }) {
  const now = useNow()
  const label = formatCountdown(utcDate, now)
  const kickingOff = label === 'Kicking off'
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${
        kickingOff ? 'border-ink bg-gold text-ink' : 'border-line bg-surface-2 text-fg'
      }`}
    >
      {label}
    </span>
  )
}

function CardButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-8 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-surface transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight"
    >
      {children}
    </button>
  )
}

export function MatchCard({ match, showCompetition = false }: MatchCardProps) {
  const kind = statusKind(match.status)
  const scored = hasScore(match)
  const { home, away } = match.score.fullTime
  const winner = kind === 'finished' ? match.score.winner : null
  const lateNight = isLateNight(match.utcDate)
  const meta = [showCompetition ? competitionName(match.competition) : '', stageLabel(match), match.venue ?? '']
    .filter(Boolean)
    .join(' · ')

  const addToCalendar = () => {
    downloadIcs(matchIcsFilename(match), matchesCalendar([match], window.location.origin))
  }

  const share = async () => {
    const result = await shareMatch(match)
    if (result === 'copied') showToast('Copied!')
    else if (result === 'failed') showToast("Couldn't share this match")
  }

  return (
    <article
      className={`flex flex-col rounded-md border-2 border-ink bg-surface p-3 sm:p-4 ${
        kind === 'live' ? 'shadow-poster-live' : 'shadow-poster'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <time dateTime={match.utcDate} className="text-sm font-semibold tabular-nums">
            {formatKickoff(match.utcDate)}
          </time>
          {lateNight && (
            <span title="Late night (11 PM – 3 AM IST)" className="text-highlight">
              <MoonIcon className="size-3.5" />
              <span className="sr-only">Late night</span>
            </span>
          )}
        </span>
        {kind === 'scheduled' ? <Countdown utcDate={match.utcDate} /> : <StatusBadge status={match.status} />}
      </div>

      <div className="mt-3 space-y-2">
        <TeamRow team={match.homeTeam} goals={scored ? home : null} dimmed={winner === 'AWAY_TEAM'} />
        <TeamRow team={match.awayTeam} goals={scored ? away : null} dimmed={winner === 'HOME_TEAM'} />
      </div>

      <div className="mt-auto flex items-end justify-between gap-2 pt-3">
        <p className="flex min-w-0 items-center gap-1.5 truncate text-xs text-muted">
          {showCompetition && <Crest src={match.competition.emblem} name={match.competition.name} size={14} />}
          {meta}
        </p>
        <div className="flex shrink-0 gap-1.5">
          {kind === 'scheduled' && (
            <CardButton label="Add to calendar" onClick={addToCalendar}>
              <CalendarIcon className="size-4" />
            </CardButton>
          )}
          <CardButton label="Share match" onClick={share}>
            <ShareIcon className="size-4" />
          </CardButton>
        </div>
      </div>
    </article>
  )
}
