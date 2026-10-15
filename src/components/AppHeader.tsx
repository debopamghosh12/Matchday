import { Link } from 'react-router-dom'

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b-2 border-ink bg-bg">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md border-2 border-ink bg-accent text-accent-fg shadow-poster-sm" aria-hidden>
            ⚽
          </span>
          <span className="font-display text-3xl leading-none tracking-wide">Matchday</span>
        </Link>
        <span className="rounded-sm border-2 border-ink bg-surface px-2 py-0.5 text-xs font-bold">IST · UTC+5:30</span>
      </div>
    </header>
  )
}
