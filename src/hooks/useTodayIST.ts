import { useSyncExternalStore } from 'react'
import { istDateKey } from '../lib/time'
import { getNow, subscribeToClock } from './useNow'

/**
 * Today's IST date key, updating when the date rolls over at midnight IST.
 * Rides the shared 30s clock; only re-renders when the date itself changes.
 */
export function useTodayIST(): string {
  return useSyncExternalStore(subscribeToClock, () => istDateKey(getNow()))
}
