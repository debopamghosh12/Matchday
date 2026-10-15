import { describe, expect, it } from 'vitest'
import type { Match } from '../types/football'
import { groupByIstDate } from './matches'
import { addDaysToKey, formatKickoff, isLateNight, istDateKey, isValidDateKey } from './time'

// IST is UTC+5:30, so an IST date D runs from (D-1) 18:30 UTC to D 18:29:59 UTC.

describe('istDateKey: the 18:30 UTC day boundary', () => {
  it.each([
    ['2026-10-15T18:29:00Z', '2026-10-15'], // 11:59 PM IST
    ['2026-10-15T18:29:59Z', '2026-10-15'],
    ['2026-10-15T18:30:00Z', '2026-10-16'], // 12:00 AM IST, next day
    ['2026-10-15T19:00:00Z', '2026-10-16'], // a typical 12:30 AM IST Champions League kick-off
    ['2026-10-15T00:00:00Z', '2026-10-15'], // 5:30 AM IST
  ])('%s -> %s', (utc, ist) => {
    expect(istDateKey(utc)).toBe(ist)
  })

  it.each([
    ['2026-10-31T18:29:00Z', '2026-10-31'], // end of a 31-day month
    ['2026-10-31T18:30:00Z', '2026-11-01'],
    ['2026-09-30T18:30:00Z', '2026-10-01'], // end of a 30-day month
    ['2027-02-28T18:30:00Z', '2027-03-01'], // February, non-leap
    ['2028-02-28T18:30:00Z', '2028-02-29'], // February, leap year
    ['2026-12-31T18:29:00Z', '2026-12-31'], // year boundary
    ['2026-12-31T18:30:00Z', '2027-01-01'],
  ])('month/year boundary %s -> %s', (utc, ist) => {
    expect(istDateKey(utc)).toBe(ist)
  })
})

describe('groupByIstDate', () => {
  const m = (id: number, utcDate: string) => ({ id, utcDate }) as Match

  it('puts 18:29 UTC and 18:30 UTC kick-offs on different IST dates', () => {
    const groups = groupByIstDate([m(1, '2026-10-15T18:29:00Z'), m(2, '2026-10-15T18:30:00Z'), m(3, '2026-10-16T14:00:00Z')])
    expect([...groups.keys()]).toEqual(['2026-10-15', '2026-10-16'])
    expect(groups.get('2026-10-15')!.map((x) => x.id)).toEqual([1])
    expect(groups.get('2026-10-16')!.map((x) => x.id)).toEqual([2, 3])
  })

  it('moves a late UTC match on the last day of a month into the next month', () => {
    const groups = groupByIstDate([m(1, '2026-10-31T19:00:00Z')])
    expect([...groups.keys()]).toEqual(['2026-11-01'])
  })
})

describe('formatKickoff', () => {
  it('shows the IST wall-clock time', () => {
    expect(formatKickoff('2026-10-15T19:00:00Z')).toBe('12:30 AM IST')
    expect(formatKickoff('2026-10-15T13:00:00Z')).toBe('6:30 PM IST')
    expect(formatKickoff('2026-10-15T18:30:00Z')).toBe('12:00 AM IST')
  })
})

describe('date keys', () => {
  it('adds days across month and year ends', () => {
    expect(addDaysToKey('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDaysToKey('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDaysToKey('2028-03-01', -1)).toBe('2028-02-29')
    expect(addDaysToKey('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('validates real calendar dates only', () => {
    expect(isValidDateKey('2026-10-15')).toBe(true)
    expect(isValidDateKey('2028-02-29')).toBe(true)
    expect(isValidDateKey('2026-02-29')).toBe(false)
    expect(isValidDateKey('2026-02-30')).toBe(false)
    expect(isValidDateKey('2026-13-01')).toBe(false)
    expect(isValidDateKey('15-10-2026')).toBe(false)
    expect(isValidDateKey(undefined)).toBe(false)
  })
})

describe('isLateNight (11 PM to 3 AM IST, inclusive)', () => {
  it.each([
    ['2026-10-25T17:29:00Z', false], // 10:59 PM IST
    ['2026-10-25T17:30:00Z', true], // 11:00 PM IST
    ['2026-10-25T19:00:00Z', true], // 12:30 AM IST
    ['2026-10-25T21:30:00Z', true], // 3:00 AM IST
    ['2026-10-25T21:31:00Z', false], // 3:01 AM IST
    ['2026-10-25T14:00:00Z', false], // 7:30 PM IST
  ])('%s -> %s', (utc, expected) => {
    expect(isLateNight(utc)).toBe(expected)
  })
})
