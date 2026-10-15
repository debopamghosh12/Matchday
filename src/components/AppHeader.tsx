import { Link, NavLink, useLocation } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'Matches' },
  { to: '/tables', label: 'Tables' },
  { to: '/scorers', label: 'Scorers' },
]

export function AppHeader() {
  const { pathname } = useLocation()
  // "Matches" covers Today and every /day/:date page.
  const isActive = (to: string) => (to === '/' ? pathname === '/' || pathname.startsWith('/day/') : pathname.startsWith(to))

  return (
    <header className="sticky top-0 z-20 border-b-2 border-ink bg-bg">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 px-4">
        <Link
          to="/"
          className="flex h-14 items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight"
        >
          <span className="flex size-8 items-center justify-center rounded-md border-2 border-ink bg-accent text-accent-fg shadow-poster-sm" aria-hidden>
            ⚽
          </span>
          <span className="font-display text-3xl leading-none tracking-wide">Matchday</span>
        </Link>

        {/* Inline on wider screens; its own scrollable row on phones. */}
        <nav aria-label="Main" className="no-scrollbar order-last -mx-4 w-[calc(100%+2rem)] overflow-x-auto px-4 pb-2 sm:order-none sm:mx-0 sm:w-auto sm:flex-1 sm:px-0 sm:pb-0">
          <ul className="flex gap-1.5">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  aria-current={isActive(item.to) ? 'page' : undefined}
                  className={`flex h-8 items-center rounded-md border-2 px-3 text-sm font-bold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight ${
                    isActive(item.to) ? 'border-ink bg-fg text-bg' : 'border-transparent hover:border-ink'
                  }`}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <span className="ml-auto rounded-sm border-2 border-ink bg-surface px-2 py-0.5 text-xs font-bold sm:ml-0">IST · UTC+5:30</span>
      </div>
    </header>
  )
}
