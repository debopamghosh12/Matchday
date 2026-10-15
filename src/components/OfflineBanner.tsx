import { useOnline } from '../hooks/useOnline'

/** Shown while the browser is offline; data on screen comes from the service worker's cache. */
export function OfflineBanner() {
  const online = useOnline()
  if (online) return null
  return (
    <div role="status" className="border-b-2 border-ink bg-gold text-ink">
      <p className="mx-auto max-w-6xl px-4 py-1.5 text-sm font-bold">
        Offline, showing saved data. Fixtures and tables you've opened before still work; live scores pause until you're back online.
      </p>
    </div>
  )
}
