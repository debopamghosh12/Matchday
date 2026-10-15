// All display times are India Standard Time. The API returns UTC (`utcDate`);
// we convert with date-fns-tz. "Date keys" are IST calendar dates (yyyy-MM-dd).

import { addDays as addDaysFn, format, isValid, parseISO } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

export const IST_TZ = 'Asia/Kolkata'

/**
 * Memoises a formatter of API timestamps. The same few hundred kick-off strings are
 * formatted over and over (grouping, filtering, counting); Intl formatting is slow
 * enough that this shows up as main-thread time when a range of matches arrives.
 */
function memoByString(format: (utc: string) => string): (utc: string) => string {
  const cache = new Map<string, string>()
  return (utc) => {
    let value = cache.get(utc)
    if (value === undefined) {
      if (cache.size >= 5000) cache.clear()
      value = format(utc)
      cache.set(utc, value)
    }
    return value
  }
}

const istDateOfString = memoByString((utc) => formatInTimeZone(utc, IST_TZ, 'yyyy-MM-dd'))

/** IST calendar date (yyyy-MM-dd) of an instant. Defaults to now. */
export function istDateKey(instant: Date | string | number = new Date()): string {
  return typeof instant === 'string' ? istDateOfString(instant) : formatInTimeZone(instant, IST_TZ, 'yyyy-MM-dd')
}

export function todayIST(): string {
  return istDateKey(new Date())
}

/** "12:30 AM IST" */
export function formatKickoff(utcDate: string): string {
  return `${formatInTimeZone(utcDate, IST_TZ, 'h:mm a')} IST`
}

/** "12:30 AM" (compact, for calendar cells) */
export function formatKickoffShort(utcDate: string): string {
  return formatInTimeZone(utcDate, IST_TZ, 'h:mm a')
}

// Date keys are plain calendar dates, so these helpers parse them as local
// midnight purely for calendar arithmetic and formatting (no time zone math).

/** True for a real calendar date in yyyy-MM-dd form (rejects e.g. 2026-02-30). */
export function isValidDateKey(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = parseISO(value)
  return isValid(date) && format(date, 'yyyy-MM-dd') === value
}

export function addDaysToKey(dateKey: string, days: number): string {
  return format(addDaysFn(parseISO(dateKey), days), 'yyyy-MM-dd')
}

export function formatDateKey(dateKey: string, pattern: string): string {
  return format(parseISO(dateKey), pattern)
}

/** IST kick-off time as "HH:mm" (24h), for time-of-day rules. */
export const istTimeOfDay = memoByString((utcDate) => formatInTimeZone(utcDate, IST_TZ, 'HH:mm'))

/** Kick-off between 11 PM and 3 AM IST, both ends inclusive. */
export function isLateNight(utcDate: string): boolean {
  const time = istTimeOfDay(utcDate)
  return time >= '23:00' || time <= '03:00'
}
