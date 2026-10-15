import type { CompetitionRef, Match, MatchStatus } from '../types/football'
import { istDateKey } from './time'

export type StatusKind = 'scheduled' | 'live' | 'finished' | 'postponed'

const STATUS_KIND: Record<MatchStatus, StatusKind> = {
  SCHEDULED: 'scheduled',
  TIMED: 'scheduled',
  IN_PLAY: 'live',
  PAUSED: 'live',
  EXTRA_TIME: 'live',
  PENALTY_SHOOTOUT: 'live',
  LIVE: 'live',
  FINISHED: 'finished',
  AWARDED: 'finished',
  POSTPONED: 'postponed',
  SUSPENDED: 'postponed',
  CANCELLED: 'postponed',
}

const STATUS_LABEL: Partial<Record<MatchStatus, string>> = {
  PAUSED: 'Half-time',
  EXTRA_TIME: 'Extra time',
  PENALTY_SHOOTOUT: 'Penalties',
  AWARDED: 'Awarded',
  SUSPENDED: 'Suspended',
  CANCELLED: 'Cancelled',
}

const KIND_LABEL: Record<StatusKind, string> = {
  scheduled: 'Scheduled',
  live: 'Live',
  finished: 'Finished',
  postponed: 'Postponed',
}

export function statusKind(status: MatchStatus): StatusKind {
  return STATUS_KIND[status] ?? 'scheduled'
}

export function statusLabel(status: MatchStatus): string {
  return STATUS_LABEL[status] ?? KIND_LABEL[statusKind(status)]
}

/** Whether to show the score (live or finished). */
export function hasScore(match: Match): boolean {
  const kind = statusKind(match.status)
  return (kind === 'live' || kind === 'finished') && match.score.fullTime.home !== null
}

const STAGE_LABEL: Record<string, string> = {
  REGULAR_SEASON: '',
  LEAGUE_STAGE: 'League phase',
  GROUP_STAGE: 'Group stage',
  PLAYOFFS: 'Play-offs',
  PLAYOFF_ROUND: 'Play-off round',
  LAST_64: 'Round of 64',
  LAST_32: 'Round of 32',
  LAST_16: 'Round of 16',
  ROUND_OF_16: 'Round of 16',
  QUARTER_FINALS: 'Quarter-finals',
  SEMI_FINALS: 'Semi-finals',
  THIRD_PLACE: 'Third place',
  FINAL: 'Final',
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** "Matchday 8", "League phase · Matchday 2", "Round of 16", "Group A · Matchday 3" */
export function stageLabel(match: Match): string {
  const roundBased = ['REGULAR_SEASON', 'LEAGUE_STAGE', 'GROUP_STAGE'].includes(match.stage)
  const stage = match.group ? titleCase(match.group) : (STAGE_LABEL[match.stage] ?? titleCase(match.stage))
  const matchday = roundBased && match.matchday ? `Matchday ${match.matchday}` : ''
  return [stage, matchday].filter(Boolean).join(' · ')
}

/** Display order for competitions: the big leagues first, then the rest. */
const COMPETITION_ORDER = ['CL', 'PL', 'PD', 'SA', 'BL1', 'FL1', 'EC', 'WC', 'ELC', 'DED', 'PPL', 'BSA']

const SHORT_NAME: Record<string, string> = {
  CL: 'Champions League',
  PL: 'Premier League',
  PD: 'La Liga',
  SA: 'Serie A',
  BL1: 'Bundesliga',
  FL1: 'Ligue 1',
  EC: 'Euros',
  WC: 'World Cup',
  ELC: 'Championship',
  DED: 'Eredivisie',
  PPL: 'Primeira Liga',
  BSA: 'Brasileirão',
}

/** Familiar name: "La Liga" rather than the API's "Primera Division". */
export function competitionName(competition: { code: string; name: string }): string {
  return SHORT_NAME[competition.code] ?? competition.name
}

export function competitionRank(code: string): number {
  const i = COMPETITION_ORDER.indexOf(code)
  return i === -1 ? COMPETITION_ORDER.length : i
}

export interface CompetitionGroup {
  competition: CompetitionRef
  matches: Match[]
}

/** Group matches by competition (ranked), each sorted by kick-off. */
export function groupByCompetition(matches: Match[]): CompetitionGroup[] {
  const groups = new Map<string, CompetitionGroup>()
  for (const match of matches) {
    const code = match.competition.code
    let group = groups.get(code)
    if (!group) {
      group = { competition: match.competition, matches: [] }
      groups.set(code, group)
    }
    group.matches.push(match)
  }
  for (const group of groups.values()) {
    group.matches.sort((a, b) => a.utcDate.localeCompare(b.utcDate))
  }
  return [...groups.values()].sort(
    (a, b) => competitionRank(a.competition.code) - competitionRank(b.competition.code),
  )
}

/** Bucket matches by IST date key. */
export function groupByIstDate(matches: Match[]): Map<string, Match[]> {
  const byDate = new Map<string, Match[]>()
  for (const match of matches) {
    const key = istDateKey(match.utcDate)
    const list = byDate.get(key)
    if (list) list.push(match)
    else byDate.set(key, [match])
  }
  return byDate
}
