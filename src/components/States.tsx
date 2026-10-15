import { ApiError } from '../lib/api'

export function MatchListSkeleton({ groups = 2, cards = 3 }: { groups?: number; cards?: number }) {
  return (
    <div className="space-y-8" aria-busy aria-label="Loading matches">
      {Array.from({ length: groups }, (_, g) => (
        <div key={g} className="animate-pulse">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="size-9 rounded-md bg-surface-2" />
            <div className="h-6 w-44 rounded bg-surface-2" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: cards }, (_, c) => (
              <div key={c} className="h-[136px] rounded-md border-2 border-ink bg-surface p-4 shadow-poster">
                <div className="flex justify-between">
                  <div className="h-4 w-24 rounded bg-surface-2" />
                  <div className="h-4 w-16 rounded-full bg-surface-2" />
                </div>
                <div className="mt-4 h-4 w-3/4 rounded bg-surface-2" />
                <div className="mt-3 h-4 w-2/3 rounded bg-surface-2" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center rounded-md border-2 border-dashed border-ink bg-surface px-6 py-16 text-center">
      <span className="text-4xl" aria-hidden>
        ⚽
      </span>
      <p className="mt-3 font-display text-3xl tracking-wide">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-muted">{hint}</p>}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const apiError = error instanceof ApiError ? error : null
  const rateLimited = apiError?.isRateLimited

  const title = rateLimited ? 'Too many requests' : "Couldn't load matches"
  const message = rateLimited
    ? `The free football data plan allows 10 requests a minute. Try again${
        apiError?.retryAfter ? ` in about ${apiError.retryAfter}s` : ' shortly'
      }.`
    : apiError?.message || 'Something went wrong while fetching matches.'

  return (
    <div role="alert" className="flex flex-col items-center rounded-md border-2 border-ink bg-surface px-6 py-14 text-center shadow-poster">
      <span className="text-4xl" aria-hidden>
        {rateLimited ? '⏳' : '⚠️'}
      </span>
      <p className="mt-3 font-display text-3xl tracking-wide">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-md border-2 border-ink bg-accent px-4 py-2 text-sm font-bold text-accent-fg shadow-poster-sm transition-transform hover:-translate-y-px active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
      >
        Try again
      </button>
    </div>
  )
}
