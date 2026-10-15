// Types for the football-data.org v4 API (only the fields this app uses are
// required; everything else the API may omit on the free tier is optional).

export type MatchStatus =
  | 'SCHEDULED'
  | 'TIMED'
  | 'IN_PLAY'
  | 'PAUSED'
  | 'EXTRA_TIME'
  | 'PENALTY_SHOOTOUT'
  | 'LIVE'
  | 'FINISHED'
  | 'AWARDED'
  | 'SUSPENDED'
  | 'POSTPONED'
  | 'CANCELLED'

export interface Area {
  id: number
  name: string
  code: string
  flag: string | null
}

export interface CompetitionRef {
  id: number
  name: string
  code: string
  type: string
  emblem: string | null
}

export interface Season {
  id: number
  startDate: string
  endDate: string
  currentMatchday: number | null
  winner?: TeamRef | null
}

export interface TeamRef {
  id: number | null
  name: string | null
  shortName: string | null
  tla: string | null
  crest: string | null
}

export interface ScoreLine {
  home: number | null
  away: number | null
}

export interface Score {
  winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null
  duration: 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT'
  fullTime: ScoreLine
  halfTime: ScoreLine
}

export interface Match {
  id: number
  utcDate: string
  status: MatchStatus
  matchday: number | null
  stage: string
  group: string | null
  lastUpdated: string
  area: Area
  competition: CompetitionRef
  season: Season
  homeTeam: TeamRef
  awayTeam: TeamRef
  score: Score
  /** Not included by the /matches list endpoint; only on /matches/{id}. */
  venue?: string | null
}

export interface Competition extends CompetitionRef {
  area: Area
  plan?: string
  currentSeason: Season | null
}

/** Shape returned by our own /api/matches proxy. */
export interface MatchesResponse {
  from: string
  to: string
  competitions: string[]
  matches: Match[]
  fetchedAt: string
}

/** Shape returned by our own /api/competitions proxy. */
export interface CompetitionsResponse {
  competitions: Competition[]
}

// --- Standings & scorers ------------------------------------------------------

export type FormResult = 'W' | 'D' | 'L'

export interface StandingRow {
  position: number
  team: TeamRef
  playedGames: number
  won: number
  draw: number
  lost: number
  points: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  /** Last results in this competition, oldest first (at most 5); null if unknown. */
  form: FormResult[] | null
}

export interface StandingTable {
  stage: string
  type: string
  /** "Group A", "League phase", or a placeholder like "Matchday" for a single table. */
  group: string | null
  table: StandingRow[]
}

/** Shape returned by our own /api/standings/:code proxy. */
export interface StandingsResponse {
  competition: CompetitionRef
  season: Season
  /** Only TOTAL tables (home/away splits dropped). */
  standings: StandingTable[]
  /** The free tier sends no form, so we derive it from finished matches when we can. */
  formSource: 'api' | 'computed' | 'unavailable'
  fetchedAt: string
}

export interface Scorer {
  player: { id: number; name: string; nationality: string | null }
  team: TeamRef
  playedMatches: number | null
  goals: number
  assists: number | null
  penalties: number | null
}

/** Shape returned by our own /api/scorers/:code proxy. */
export interface ScorersResponse {
  competition: CompetitionRef
  season: Season
  scorers: Scorer[]
  fetchedAt: string
}

// --- Teams -----------------------------------------------------------------------

/** Shape returned by our own /api/teams/:id proxy. */
export interface TeamDetails {
  id: number
  name: string
  shortName: string | null
  tla: string | null
  crest: string | null
  area: Area | null
  venue: string | null
  founded: number | null
  /** e.g. "Sky Blue / White" */
  clubColors: string | null
  website: string | null
  runningCompetitions: CompetitionRef[]
}

/** Shape returned by our own /api/teams/:id/matches proxy. */
export interface TeamMatchesResponse {
  teamId: number
  /** IST dates, inclusive: 30 days back to 60 days ahead. */
  from: string
  to: string
  matches: Match[]
  fetchedAt: string
}

/** Error body returned by our proxy on failure. */
export interface ApiErrorBody {
  error: string
  status: number
  retryAfter?: number
}
