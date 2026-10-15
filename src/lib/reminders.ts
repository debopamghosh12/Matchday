// Kick-off reminders without a push server: stored in localStorage and fired by
// the open app (see ReminderScheduler). They cannot fire while the app is closed;
// the UI says so and points to "Add to calendar" for that.

import { useMemo } from 'react'
import type { Match } from '../types/football'
import { matchDayUrl, matchTitle } from './matchActions'
import { competitionName } from './matches'
import { createStoredState } from './storedState'
import { formatKickoff } from './time'

export const REMINDER_LEAD_MS = 30 * 60_000

export interface Reminder {
  matchId: number
  /** When to notify (ms epoch): 30 minutes before kick-off. */
  fireAt: number
  kickoff: number
  title: string
  body: string
  url: string
}

export const reminderStore = createStoredState<Reminder[]>('matchday:reminders', [], (raw) => {
  if (!Array.isArray(raw)) return undefined
  return raw.filter(
    (r): r is Reminder =>
      !!r && Number.isInteger(r.matchId) && Number.isFinite(r.fireAt) && Number.isFinite(r.kickoff) && typeof r.title === 'string',
  )
})

export function reminderFor(match: Match, origin = window.location.origin): Reminder {
  const kickoff = Date.parse(match.utcDate)
  return {
    matchId: match.id,
    fireAt: kickoff - REMINDER_LEAD_MS,
    kickoff,
    title: `${matchTitle(match)} starts in 30 minutes`,
    body: `${competitionName(match.competition)} · kick-off ${formatKickoff(match.utcDate)}`,
    url: matchDayUrl(match, origin),
  }
}

export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window

/** Shows the notification through the service worker when there is one (required on Android). */
export async function showReminder(reminder: Reminder): Promise<void> {
  const options: NotificationOptions = {
    body: reminder.body,
    tag: `match-${reminder.matchId}`, // several open tabs firing the same reminder collapse into one
    icon: '/icons/icon-192.png',
    data: { url: reminder.url },
  }
  const registration = await navigator.serviceWorker?.getRegistration().catch(() => undefined)
  if (registration) return registration.showNotification(reminder.title, options)
  const notification = new Notification(reminder.title, options)
  notification.onclick = () => {
    window.focus()
    window.location.href = reminder.url
  }
}

export function useReminders() {
  const reminders = reminderStore.use()
  return useMemo(() => {
    const ids = new Set(reminders.map((r) => r.matchId))
    return {
      reminders,
      has: (matchId: number) => ids.has(matchId),
      add: (reminder: Reminder) => reminderStore.set((list) => [...list.filter((r) => r.matchId !== reminder.matchId), reminder]),
      remove: (matchId: number) => reminderStore.set((list) => list.filter((r) => r.matchId !== matchId)),
    }
  }, [reminders])
}
