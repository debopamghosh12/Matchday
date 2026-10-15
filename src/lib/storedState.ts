import { useSyncExternalStore } from 'react'

/**
 * A small piece of state persisted in localStorage and shared by every component
 * that uses it (and other tabs, via the `storage` event). Storage failures
 * (private mode, quota, blocked) fall back to in-memory state.
 */
export function createStoredState<T>(key: string, fallback: T, parse: (raw: unknown) => T | undefined) {
  const listeners = new Set<() => void>()
  let value: T = read()

  function read(): T {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return fallback
      return parse(JSON.parse(raw)) ?? fallback
    } catch {
      return fallback
    }
  }

  function set(next: T | ((prev: T) => T)) {
    value = typeof next === 'function' ? (next as (prev: T) => T)(value) : next
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Not persisted; still shared in memory for this session.
    }
    listeners.forEach((l) => l())
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return
      value = read()
      listener()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(listener)
      window.removeEventListener('storage', onStorage)
    }
  }

  const get = () => value
  const use = () => useSyncExternalStore(subscribe, get)

  return { get, set, use }
}
