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

/** Error body returned by our proxy on failure. */
export interface ApiErrorBody {
  error: string
  status: number
  retryAfter?: number
}
