import { describe, expect, it } from 'vitest'
import { buildCalendar, escapeIcsText, foldLine, formatIcsDate, type IcsEvent } from './ics'

const event: IcsEvent = {
  uid: 'match-1@matchday',
  start: '2026-10-25T19:00:00Z',
  durationMinutes: 120,
  summary: 'Real Madrid vs Barcelona (La Liga)',
  location: 'Santiago Bernabéu, Madrid',
  description: 'La Liga; Matchday 10\nKick-off 12:30 AM IST',
  url: 'https://example.com/day/2026-10-26',
  alarmMinutesBefore: 30,
}
const NOW = new Date('2026-10-15T12:00:00Z')
const octets = (s: string) => new TextEncoder().encode(s).length

/** Unfolds continuation lines (RFC 5545 section 3.1) and splits on CRLF. */
const unfold = (ics: string) => ics.replace(/\r\n /g, '').split('\r\n')

describe('escapeIcsText', () => {
  it('escapes commas, semicolons, backslashes and newlines', () => {
    expect(escapeIcsText('a,b;c\\d\ne\r\nf')).toBe('a\\,b\\;c\\\\d\\ne\\nf')
  })
  it('escapes backslashes before adding new ones', () => {
    expect(escapeIcsText('\\,')).toBe('\\\\\\,')
  })
})

describe('formatIcsDate', () => {
  it('formats UTC with a Z suffix and no separators', () => {
    expect(formatIcsDate('2026-10-25T19:00:00Z')).toBe('20261025T190000Z')
    expect(formatIcsDate(new Date(Date.UTC(2026, 0, 2, 3, 4, 5, 678)))).toBe('20260102T030405Z')
  })
  it('converts offsets to UTC', () => {
    expect(formatIcsDate('2026-10-26T00:30:00+05:30')).toBe('20261025T190000Z')
  })
  it('rejects invalid dates', () => {
    expect(() => formatIcsDate('nope')).toThrow(RangeError)
  })
})

describe('foldLine', () => {
  it('leaves short lines alone', () => {
    expect(foldLine('SUMMARY:short')).toBe('SUMMARY:short')
  })
  it('folds at 75 octets with leading-space continuations', () => {
    const folded = foldLine('DESCRIPTION:' + 'x'.repeat(200))
    const lines = folded.split('\r\n')
    expect(lines.length).toBeGreaterThan(1)
    for (const line of lines) expect(octets(line)).toBeLessThanOrEqual(75)
    expect(lines.slice(1).every((l) => l.startsWith(' '))).toBe(true)
    expect(folded.replace(/\r\n /g, '')).toBe('DESCRIPTION:' + 'x'.repeat(200))
  })
  it('never splits a multi-byte character', () => {
    const value = 'LOCATION:' + 'é'.repeat(100) + '⚽'.repeat(20)
    const lines = foldLine(value).split('\r\n')
    for (const line of lines) {
      expect(octets(line)).toBeLessThanOrEqual(75)
      expect(line).not.toContain('�')
    }
    expect(foldLine(value).replace(/\r\n /g, '')).toBe(value)
  })
})

describe('buildCalendar', () => {
  const ics = buildCalendar([event], { name: 'My, teams', now: NOW })
  const lines = unfold(ics)

  it('uses CRLF line endings throughout and ends with one', () => {
    expect(ics.endsWith('\r\n')).toBe(true)
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/)
  })

  it('wraps events in a VCALENDAR with version and product id', () => {
    expect(lines[0]).toBe('BEGIN:VCALENDAR')
    expect(lines).toContain('VERSION:2.0')
    expect(lines.some((l) => l.startsWith('PRODID:'))).toBe(true)
    expect(lines[lines.length - 2]).toBe('END:VCALENDAR')
    expect(lines).toContain('X-WR-CALNAME:My\\, teams')
  })

  it('writes UTC start, a 2h end, and the stamp', () => {
    expect(lines).toContain('DTSTART:20261025T190000Z')
    expect(lines).toContain('DTEND:20261025T210000Z')
    expect(lines).toContain('DTSTAMP:20261015T120000Z')
  })

  it('escapes text properties', () => {
    expect(lines).toContain('SUMMARY:Real Madrid vs Barcelona (La Liga)')
    expect(lines).toContain('LOCATION:Santiago Bernabéu\\, Madrid')
    expect(lines).toContain('DESCRIPTION:La Liga\\; Matchday 10\\nKick-off 12:30 AM IST')
    expect(lines).toContain('URL:https://example.com/day/2026-10-26')
  })

  it('adds a display alarm 30 minutes before', () => {
    const alarm = lines.slice(lines.indexOf('BEGIN:VALARM'), lines.indexOf('END:VALARM') + 1)
    expect(alarm).toEqual([
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Real Madrid vs Barcelona (La Liga)',
      'TRIGGER:-PT30M',
      'END:VALARM',
    ])
  })

  it('balances BEGIN/END blocks and writes one VEVENT per event', () => {
    const multi = unfold(buildCalendar([event, { ...event, uid: 'match-2@matchday', location: undefined }], { now: NOW }))
    expect(multi.filter((l) => l === 'BEGIN:VEVENT')).toHaveLength(2)
    expect(multi.filter((l) => l.startsWith('LOCATION:'))).toHaveLength(1)
    for (const block of ['VCALENDAR', 'VEVENT', 'VALARM']) {
      expect(multi.filter((l) => l === `BEGIN:${block}`).length).toBe(multi.filter((l) => l === `END:${block}`).length)
    }
  })

  it('folds long lines in the output', () => {
    const long = buildCalendar([{ ...event, description: 'x'.repeat(300) }], { now: NOW })
    for (const line of long.split('\r\n')) expect(octets(line)).toBeLessThanOrEqual(75)
  })

  it('omits the alarm when not requested', () => {
    expect(buildCalendar([{ ...event, alarmMinutesBefore: undefined }], { now: NOW })).not.toContain('VALARM')
  })
})
