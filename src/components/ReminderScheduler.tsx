import { useEffect, useState } from 'react'
import { reminderStore, showReminder } from '../lib/reminders'

// Re-check at least hourly (long timers drift) and whenever the tab becomes visible
// again (browsers throttle timers in background tabs).
const MAX_WAIT_MS = 60 * 60_000

/**
 * Fires stored reminders while the app is open. On load (and after any change) it
 * sends anything now due, drops reminders whose kick-off already passed while the
 * app was closed, and sets one timer for the next reminder.
 */
export function ReminderScheduler() {
  const reminders = reminderStore.use()
  const [wake, setWake] = useState(0)

  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && setWake((n) => n + 1)
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  useEffect(() => {
    const now = Date.now()
    const due = reminders.filter((r) => r.fireAt <= now)
    if (due.length > 0) {
      const canNotify = 'Notification' in window && Notification.permission === 'granted'
      for (const r of due) {
        // Missed entirely (app was closed through kick-off): nothing useful to say now.
        if (canNotify && r.kickoff > now) void showReminder(r)
      }
      const dueIds = new Set(due.map((r) => r.matchId))
      reminderStore.set((list) => list.filter((r) => !dueIds.has(r.matchId)))
      return
    }
    const next = Math.min(...reminders.map((r) => r.fireAt))
    if (!Number.isFinite(next)) return
    const timer = setTimeout(() => setWake((n) => n + 1), Math.min(next - now, MAX_WAIT_MS))
    return () => clearTimeout(timer)
  }, [reminders, wake])

  return null
}
