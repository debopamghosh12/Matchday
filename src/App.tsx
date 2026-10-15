import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Navigate, Outlet, Route, Routes, useMatch, useNavigate, useParams } from 'react-router-dom'
import { AppHeader } from './components/AppHeader'
import { DatePickerButton } from './components/DatePickerButton'
import { DateSlider } from './components/DateSlider'
import { FilterBar } from './components/FilterBar'
import { HeroBanner } from './components/HeroBanner'
import { OfflineBanner } from './components/OfflineBanner'
import { ReminderScheduler } from './components/ReminderScheduler'
import { Toaster } from './components/Toaster'
import { DayView } from './components/views/DayView'
import { useMatchFilters } from './hooks/useMatchFilters'
import { useTodayIST } from './hooks/useTodayIST'
import { ART_CREDIT } from './lib/heroArt'
import { addDaysToKey, formatDateKey, isValidDateKey } from './lib/time'

// Pages other than the day views load on demand, keeping the first load small.
const TablesView = lazy(() => import('./components/views/TablesView').then((m) => ({ default: m.TablesView })))
const ScorersView = lazy(() => import('./components/views/ScorersView').then((m) => ({ default: m.ScorersView })))
const TeamView = lazy(() => import('./components/views/TeamView').then((m) => ({ default: m.TeamView })))
const MyTeamsView = lazy(() => import('./components/views/MyTeamsView').then((m) => ({ default: m.MyTeamsView })))

function PageFallback() {
  return (
    <main className="mx-auto max-w-6xl px-4 pt-8" aria-busy aria-label="Loading page">
      <div className="h-14 w-64 animate-pulse rounded-md bg-surface-2" />
    </main>
  )
}

function heroTitle(date: string, today: string): string {
  if (date === today) return "Today's Matches"
  if (date === addDaysToKey(today, 1)) return "Tomorrow's Matches"
  if (date === addDaysToKey(today, -1)) return "Yesterday's Matches"
  return `${formatDateKey(date, 'EEEE')}'s Matches`
}

/** Today + /day/:date share this layout so the hero and date slider stay mounted between days. */
function DayLayout() {
  const today = useTodayIST()
  const navigate = useNavigate()
  const dayMatch = useMatch('/day/:date')
  const param = dayMatch?.params.date
  const selectedDate = isValidDateKey(param) ? param : today
  const { predicate } = useMatchFilters()
  // Paint the hero artwork (the page's largest element) before rendering the slider,
  // filters and list, so it isn't held up behind them. Fallback for slow images.
  const [showContent, setShowContent] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500)
    return () => clearTimeout(timer)
  }, [])
  const revealContent = useCallback(() => setShowContent(true), [])

  const select = useCallback(
    (date: string) => navigate(date === today ? '/' : `/day/${date}`),
    [navigate, today],
  )

  return (
    <>
      <HeroBanner
        title={heroTitle(selectedDate, today)}
        subtitle={`${formatDateKey(selectedDate, 'EEEE, d MMMM yyyy')} · times in IST`}
        onFirstPaint={revealContent}
      />
      <main className="mx-auto max-w-6xl px-4 pb-8 sm:pb-10">
        {showContent && (
          <>
            <div className="mt-3 mb-3 flex items-center gap-3 sm:mt-4">
              <div className="min-w-0 flex-1">
                <DateSlider selectedDate={selectedDate} onSelect={select} filter={predicate} />
              </div>
              <div className="hidden sm:block">
                <DatePickerButton value={selectedDate} onSelect={select} />
              </div>
            </div>
            <div className="mb-6">
              <FilterBar />
            </div>
            <Outlet />
          </>
        )}
      </main>
    </>
  )
}

function TodayRoute() {
  const today = useTodayIST()
  return <DayView date={today} />
}

function DayRoute() {
  const { date } = useParams()
  if (!isValidDateKey(date)) return <Navigate to="/" replace />
  return <DayView date={date} />
}

function AppFooter() {
  return (
    <footer className="border-t-2 border-ink">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-5 text-xs text-muted">
        <p>
          Illustrations by{' '}
          <a href={ART_CREDIT.url} className="font-semibold text-fg underline underline-offset-2 hover:text-highlight">
            {ART_CREDIT.name}
          </a>
        </p>
        <p>
          Match data from{' '}
          <a href="https://www.football-data.org" className="font-semibold text-fg underline underline-offset-2 hover:text-highlight">
            football-data.org
          </a>
        </p>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <OfflineBanner />
      {/* At least a screen tall, so the footer starts below the fold and doesn't jump as content loads. */}
      <div className="min-h-svh flex-1">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route element={<DayLayout />}>
              <Route path="/" element={<TodayRoute />} />
              <Route path="/day/:date" element={<DayRoute />} />
            </Route>
            <Route path="/tables/:code?" element={<TablesView />} />
            <Route path="/scorers/:code?" element={<ScorersView />} />
            <Route path="/team/:id" element={<TeamView />} />
            <Route path="/my-teams" element={<MyTeamsView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
      <AppFooter />
      <Toaster />
      <ReminderScheduler />
    </div>
  )
}
