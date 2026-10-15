import { describe, expect, it } from 'vitest'
import { formatCountdown } from './countdown'

const KICKOFF = Date.parse('2026-10-25T19:00:00Z')
const before = (minutes: number, seconds = 0) => KICKOFF - minutes * 60_000 - seconds * 1000

describe('formatCountdown', () => {
  it('shows hours and minutes at an hour or more', () => {
    expect(formatCountdown(KICKOFF, before(134))).toBe('Starts in 2h 14m')
    expect(formatCountdown(KICKOFF, before(60))).toBe('Starts in 1h 0m')
  })
  it('shows only minutes under an hour', () => {
    expect(formatCountdown(KICKOFF, before(34))).toBe('Starts in 34m')
    expect(formatCountdown(KICKOFF, before(59))).toBe('Starts in 59m')
  })
  it('rounds partial minutes up, so it never says 0m before kick-off', () => {
    expect(formatCountdown(KICKOFF, before(0, 10))).toBe('Starts in 1m')
    expect(formatCountdown(KICKOFF, before(33, 30))).toBe('Starts in 34m')
  })
  it('shows days and hours more than a day out', () => {
    expect(formatCountdown(KICKOFF, before(3 * 1440 + 4 * 60 + 5))).toBe('Starts in 3d 4h')
  })
  it('says "Kicking off" at and after kick-off', () => {
    expect(formatCountdown(KICKOFF, KICKOFF)).toBe('Kicking off')
    expect(formatCountdown(KICKOFF, KICKOFF + 5 * 60_000)).toBe('Kicking off')
  })
  it('accepts the API utcDate string', () => {
    expect(formatCountdown('2026-10-25T19:00:00Z', before(90))).toBe('Starts in 1h 30m')
  })
})
