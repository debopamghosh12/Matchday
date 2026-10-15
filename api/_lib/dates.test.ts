import { describe, expect, it } from 'vitest'
import { addDays, chunkRange, diffDays, istDateOf } from './dates.js'
import { MAX_RANGE_DAYS } from './footballData.js'

/** Every day in [from, to], to check chunks cover the range exactly once. */
function days(from: string, to: string): string[] {
  const out: string[] = []
  for (let d = from; diffDays(d, to) >= 0; d = addDays(d, 1)) out.push(d)
  return out
}

describe('chunkRange (10-day upstream limit)', () => {
  const from = '2026-10-25'
  const cases: Array<[number, Array<[string, string]>]> = [
    [1, [['2026-10-25', '2026-10-25']]],
    [10, [['2026-10-25', '2026-11-03']]],
    [
      11,
      [
        ['2026-10-25', '2026-11-03'],
        ['2026-11-04', '2026-11-04'],
      ],
    ],
    [
      31,
      [
        ['2026-10-25', '2026-11-03'],
        ['2026-11-04', '2026-11-13'],
        ['2026-11-14', '2026-11-23'],
        ['2026-11-24', '2026-11-24'],
      ],
    ],
  ]

  it.each(cases)('%i day(s) -> expected chunks', (length, expected) => {
    expect(chunkRange(from, addDays(from, length - 1), MAX_RANGE_DAYS)).toEqual(expected)
  })

  it.each([1, 10, 11, 31, 62])('%i days: contiguous, no overlap, every chunk within the limit', (length) => {
    const to = addDays(from, length - 1)
    const chunks = chunkRange(from, to, MAX_RANGE_DAYS)
    expect(chunks.flatMap(([a, b]) => days(a, b))).toEqual(days(from, to))
    for (const [a, b] of chunks) {
      // We send dateTo = b + 1 (upstream dateTo is exclusive), so the span is b - a + 1.
      expect(diffDays(a, addDays(b, 1))).toBeLessThanOrEqual(MAX_RANGE_DAYS)
    }
    expect(chunks).toHaveLength(Math.ceil(length / MAX_RANGE_DAYS))
  })

  it('returns nothing for an inverted range', () => {
    expect(chunkRange('2026-10-25', '2026-10-24', MAX_RANGE_DAYS)).toEqual([])
  })
})

describe('istDateOf (server-side IST dates)', () => {
  it.each([
    ['2026-10-15T18:29:00Z', '2026-10-15'],
    ['2026-10-15T18:30:00Z', '2026-10-16'],
    ['2026-10-31T18:30:00Z', '2026-11-01'],
    ['2026-12-31T18:30:00Z', '2027-01-01'],
  ])('%s -> %s', (utc, ist) => {
    expect(istDateOf(utc)).toBe(ist)
  })
})
