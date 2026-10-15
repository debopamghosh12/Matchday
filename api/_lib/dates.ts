// Minimal date helpers for the server. Asia/Kolkata has a fixed +05:30 offset
// (no DST), so plain arithmetic on UTC dates is exact here.

const DAY_MS = 24 * 60 * 60 * 1000
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function isValidDate(value: string | null): value is string {
  if (!value || !DATE_RE.test(value)) return false
  const d = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value)
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  return new Date(d.getTime() + days * DAY_MS).toISOString().slice(0, 10)
}

/** Whole days from `a` to `b` (b - a). */
export function diffDays(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS)
}

/** The IST calendar date (YYYY-MM-DD) of a UTC instant. */
export function istDateOf(utc: string | number | Date): string {
  const ms = new Date(utc).getTime()
  return new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 10)
}

export function todayIST(): string {
  return istDateOf(Date.now())
}

/** Split an inclusive [from, to] date range into chunks of at most `size` days. */
export function chunkRange(from: string, to: string, size: number): Array<[string, string]> {
  const chunks: Array<[string, string]> = []
  let start = from
  while (diffDays(start, to) >= 0) {
    const end = diffDays(start, to) >= size ? addDays(start, size - 1) : to
    chunks.push([start, end])
    start = addDays(end, 1)
  }
  return chunks
}
