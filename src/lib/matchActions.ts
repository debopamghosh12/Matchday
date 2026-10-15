// Calendar export and sharing for matches (text built here, side effects in the callers).

import type { Match, TeamRef } from '../types/football'
import { buildCalendar, type IcsEvent } from './ics'
import { competitionName, stageLabel } from './matches'
import { formatKickoff, formatDateKey, istDateKey } from './time'

export function teamName(team: TeamRef): string {
  return team.shortName || team.name || 'TBD'
}

export function matchTitle(match: Match): string {
  return `${teamName(match.homeTeam)} vs ${teamName(match.awayTeam)}`
}

/** Absolute link to the day page the match is listed on. */
export function matchDayUrl(match: Match, origin: string): string {
  return `${origin}/day/${istDateKey(match.utcDate)}`
}

export function matchToIcsEvent(match: Match, origin: string): IcsEvent {
  const url = matchDayUrl(match, origin)
  const competition = competitionName(match.competition)
  return {
    uid: `match-${match.id}@matchday`,
    start: match.utcDate,
    durationMinutes: 120,
    summary: `${matchTitle(match)} (${competition})`,
    location: match.venue ?? undefined,
    description: [competition, stageLabel(match), `Kick-off ${formatKickoff(match.utcDate)}`, url].filter(Boolean).join('\n'),
    url,
    alarmMinutesBefore: 30,
  }
}

export function matchesCalendar(matches: Match[], origin: string, name?: string): string {
  return buildCalendar(
    matches.map((m) => matchToIcsEvent(m, origin)),
    { name },
  )
}

export function slug(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function matchIcsFilename(match: Match): string {
  return `${slug(matchTitle(match))}-${istDateKey(match.utcDate)}.ics`
}

/** "Real Madrid vs Barcelona · La Liga · Sun 26 Oct, 12:30 AM IST · https://…/day/2026-10-26" */
export function matchShareText(match: Match, origin: string): string {
  const when = `${formatDateKey(istDateKey(match.utcDate), 'EEE d MMM')}, ${formatKickoff(match.utcDate)}`
  return [matchTitle(match), competitionName(match.competition), when, matchDayUrl(match, origin)].join(' · ')
}
