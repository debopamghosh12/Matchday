import { useEffect, useState } from 'react'
import { todayIST } from '../lib/time'

/** Today's IST date key, updating when the date rolls over at midnight IST. */
export function useTodayIST(): string {
  const [today, setToday] = useState(todayIST)

  useEffect(() => {
    const id = setInterval(() => setToday(todayIST()), 30_000)
    return () => clearInterval(id)
  }, [])

  return today
}
