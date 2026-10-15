import { useSyncExternalStore } from 'react'

// One shared clock for the whole page: a single 30s interval runs while any
// component is subscribed, instead of one timer per match card.
const TICK_MS = 30_000
const listeners = new Set<() => void>()
let now = Date.now()
let timer: ReturnType<typeof setInterval> | undefined

function tick() {
  now = Date.now()
  listeners.forEach((l) => l())
}

export function subscribeToClock(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    now = Date.now()
    timer = setInterval(tick, TICK_MS)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) clearInterval(timer)
  }
}

export const getNow = () => now

/** Current time in ms, updated every 30 seconds. */
export function useNow(): number {
  return useSyncExternalStore(subscribeToClock, getNow)
}
