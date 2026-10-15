import { Link } from 'react-router-dom'

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-lg bg-accent text-accent-fg" aria-hidden>
            ⚽
          </span>
          <span>Matchday</span>
        </Link>
        <span className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-muted">IST · UTC+5:30</span>
      </div>
    </header>
  )
}
