// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import type { Match, MatchStatus } from '../types/football'
import { MatchCard } from './MatchCard'

afterEach(cleanup)

function makeMatch(overrides: { utcDate: string; status: MatchStatus; score?: [number | null, number | null] }): Match {
  const [home, away] = overrides.score ?? [null, null]
  return {
    id: 1,
    utcDate: overrides.utcDate,
    status: overrides.status,
    matchday: 10,
    stage: 'REGULAR_SEASON',
    group: null,
    lastUpdated: '2026-10-01T00:00:00Z',
    area: { id: 1, name: 'Spain', code: 'ESP', flag: null },
    competition: { id: 2014, name: 'Primera Division', code: 'PD', type: 'LEAGUE', emblem: null },
    season: { id: 1, startDate: '2026-08-15', endDate: '2027-05-30', currentMatchday: 10 },
    homeTeam: { id: 86, name: 'Real Madrid CF', shortName: 'Real Madrid', tla: 'RMA', crest: null },
    awayTeam: { id: 81, name: 'FC Barcelona', shortName: 'Barça', tla: 'FCB', crest: null },
    score: { winner: null, duration: 'REGULAR', fullTime: { home, away }, halfTime: { home: null, away: null } },
  }
}

const renderCard = (match: Match) =>
  render(
    <MemoryRouter>
      <MatchCard match={match} />
    </MemoryRouter>,
  )

describe('MatchCard', () => {
  it('shows the kick-off in IST (19:00 UTC is 12:30 AM IST)', () => {
    renderCard(makeMatch({ utcDate: '2099-10-25T19:00:00Z', status: 'TIMED' }))
    const time = screen.getByText('12:30 AM IST')
    expect(time.tagName).toBe('TIME')
    expect(time).toHaveAttribute('datetime', '2099-10-25T19:00:00Z')
  })

  it('marks late-night kick-offs with the moon icon', () => {
    renderCard(makeMatch({ utcDate: '2099-10-25T19:00:00Z', status: 'TIMED' }))
    expect(screen.getByTitle('Late night (11 PM – 3 AM IST)')).toBeInTheDocument()
    expect(screen.getByText('Late night')).toHaveClass('sr-only')
  })

  it('has no moon for an evening kick-off', () => {
    renderCard(makeMatch({ utcDate: '2099-10-25T14:00:00Z', status: 'TIMED' })) // 7:30 PM IST
    expect(screen.getByText('7:30 PM IST')).toBeInTheDocument()
    expect(screen.queryByTitle(/Late night/)).not.toBeInTheDocument()
  })

  it('shows the live badge and score for a match in play', () => {
    renderCard(makeMatch({ utcDate: '2026-10-25T19:00:00Z', status: 'IN_PLAY', score: [2, 1] }))
    const card = screen.getByRole('article')
    expect(within(card).getByText('Live')).toBeInTheDocument()
    expect(within(card).getByText('2')).toBeInTheDocument()
    expect(within(card).getByText('1')).toBeInTheDocument()
    // Pre-match actions are gone once the match is on.
    expect(within(card).queryByRole('button', { name: /Add to calendar/ })).not.toBeInTheDocument()
  })

  it('counts down and offers calendar + reminder before kick-off', () => {
    renderCard(makeMatch({ utcDate: '2099-10-25T19:00:00Z', status: 'TIMED' }))
    expect(screen.getByText(/^Starts in \d+d \d+h$/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add to calendar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Remind me 30 min before kick-off/ })).toBeInTheDocument()
  })

  it('links both teams to their team pages', () => {
    renderCard(makeMatch({ utcDate: '2099-10-25T19:00:00Z', status: 'TIMED' }))
    expect(screen.getByRole('link', { name: /Real Madrid/ })).toHaveAttribute('href', '/team/86')
    expect(screen.getByRole('link', { name: /Barça/ })).toHaveAttribute('href', '/team/81')
  })
})
