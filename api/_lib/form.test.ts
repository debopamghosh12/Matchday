import { describe, expect, it } from 'vitest'
import type { Match } from '../../src/types/football.js'
import { formFromMatches, parseForm, resultFor } from './form.js'

function match(id: number, utcDate: string, home: number, away: number, score: [number | null, number | null], status = 'FINISHED'): Match {
  return {
    id,
    utcDate,
    status,
    homeTeam: { id: home, name: `T${home}`, shortName: null, tla: null, crest: null },
    awayTeam: { id: away, name: `T${away}`, shortName: null, tla: null, crest: null },
    score: { winner: null, duration: 'REGULAR', fullTime: { home: score[0], away: score[1] }, halfTime: { home: null, away: null } },
  } as Match
}

describe('resultFor', () => {
  const m = match(1, '2026-10-01T19:00:00Z', 1, 2, [2, 1])
  it('scores from each side', () => {
    expect(resultFor(m, 1)).toBe('W')
    expect(resultFor(m, 2)).toBe('L')
    expect(resultFor(match(2, '2026-10-01T19:00:00Z', 1, 2, [0, 0]), 2)).toBe('D')
  })
  it('ignores teams not in the match and unfinished matches', () => {
    expect(resultFor(m, 3)).toBeNull()
    expect(resultFor(match(3, '2026-10-01T19:00:00Z', 1, 2, [null, null], 'TIMED'), 1)).toBeNull()
  })
})

describe('formFromMatches', () => {
  it('keeps the last five per team, oldest first, regardless of input order', () => {
    const games = [
      match(6, '2026-10-06T19:00:00Z', 1, 2, [3, 0]), // W
      match(1, '2026-10-01T19:00:00Z', 1, 2, [0, 1]), // L (oldest, dropped)
      match(2, '2026-10-02T19:00:00Z', 2, 1, [1, 1]), // D
      match(3, '2026-10-03T19:00:00Z', 1, 2, [2, 0]), // W
      match(4, '2026-10-04T19:00:00Z', 2, 1, [2, 0]), // L
      match(5, '2026-10-05T19:00:00Z', 1, 2, [1, 1]), // D
    ]
    const form = formFromMatches(games)
    expect(form.get(1)).toEqual(['D', 'W', 'L', 'D', 'W'])
    expect(form.get(2)).toEqual(['D', 'L', 'W', 'D', 'L'])
  })
})

describe('parseForm', () => {
  it('parses the comma format and rejects empty values', () => {
    expect(parseForm('W,D,L')).toEqual(['W', 'D', 'L'])
    expect(parseForm(null)).toBeNull()
    expect(parseForm('')).toBeNull()
  })
})
