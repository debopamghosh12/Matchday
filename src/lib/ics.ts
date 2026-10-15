// Minimal iCalendar (RFC 5545) writer: enough for match events with a reminder.

export interface IcsEvent {
  /** Globally unique and stable, so re-importing updates instead of duplicating. */
  uid: string
  start: Date | string
  durationMinutes: number
  summary: string
  description?: string
  location?: string
  url?: string
  /** Adds a display alarm this many minutes before the start. */
  alarmMinutesBefore?: number
}

const CRLF = '\r\n'
const MAX_LINE_OCTETS = 75
const encoder = new TextEncoder()

/** Escapes a TEXT value: backslash, semicolon, comma and newlines. */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')
}

/** UTC date-time with the Z suffix, e.g. 20261025T190000Z. */
export function formatIcsDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) throw new RangeError(`Invalid date: ${String(date)}`)
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/[-:]/g, '')
}

/**
 * Folds a content line to at most 75 octets per line; continuation lines start
 * with a space. Splits between characters, never inside a UTF-8 sequence.
 */
export function foldLine(line: string): string {
  const parts: string[] = []
  let current = ''
  let octets = 0
  for (const char of line) {
    const size = encoder.encode(char).length
    // Continuation lines carry a leading space, which counts toward the limit.
    const limit = parts.length === 0 ? MAX_LINE_OCTETS : MAX_LINE_OCTETS - 1
    if (octets + size > limit) {
      parts.push(current)
      current = ''
      octets = 0
    }
    current += char
    octets += size
  }
  parts.push(current)
  return parts.join(`${CRLF} `)
}

function eventLines(event: IcsEvent, stamp: string): string[] {
  const start = typeof event.start === 'string' ? new Date(event.start) : event.start
  const end = new Date(start.getTime() + event.durationMinutes * 60_000)
  const lines = [
    'BEGIN:VEVENT',
    `UID:${escapeIcsText(event.uid)}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(event.summary)}`,
  ]
  if (event.location) lines.push(`LOCATION:${escapeIcsText(event.location)}`)
  if (event.description) lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`)
  if (event.url) lines.push(`URL:${event.url}`)
  if (event.alarmMinutesBefore !== undefined) {
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcsText(event.summary)}`,
      `TRIGGER:-PT${Math.round(event.alarmMinutesBefore)}M`,
      'END:VALARM',
    )
  }
  lines.push('END:VEVENT')
  return lines
}

/** A complete VCALENDAR document with CRLF line endings. */
export function buildCalendar(events: IcsEvent[], options: { name?: string; now?: Date } = {}): string {
  const stamp = formatIcsDate(options.now ?? new Date())
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Matchday//Football Calendar//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH']
  if (options.name) lines.push(`X-WR-CALNAME:${escapeIcsText(options.name)}`)
  for (const event of events) lines.push(...eventLines(event, stamp))
  lines.push('END:VCALENDAR')
  return lines.map(foldLine).join(CRLF) + CRLF
}

/** Saves an .ics file via a temporary download link. */
export function downloadIcs(filename: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.ics') ? filename : `${filename}.ics`
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
