import { describe, expect, it } from 'vitest'
import { isLateNight } from './time'

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
