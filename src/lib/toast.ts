import { useSyncExternalStore } from 'react'

export interface Toast {
  id: number
  message: string
}

const listeners = new Set<() => void>()
let current: Toast | null = null
let nextId = 1
let hideTimer: ReturnType<typeof setTimeout> | undefined

/** Shows a short status message (one at a time; a new one replaces the old). */
export function showToast(message: string, durationMs = 2500): void {
  current = { id: nextId++, message }
  listeners.forEach((l) => l())
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    current = null
    listeners.forEach((l) => l())
  }, durationMs)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useToast(): Toast | null {
  return useSyncExternalStore(subscribe, () => current)
}
