import { useCallback } from 'react'
import { Navigate, Outlet, Route, Routes, useMatch, useNavigate, useParams } from 'react-router-dom'
import { AppHeader } from './components/AppHeader'
import { DatePickerButton } from './components/DatePickerButton'
import { DateSlider } from './components/DateSlider'
import { FilterBar } from './components/FilterBar'
import { HeroBanner } from './components/HeroBanner'
import { Toaster } from './components/Toaster'
import { DayView } from './components/views/DayView'
import { ScorersView } from './components/views/ScorersView'
import { TablesView } from './components/views/TablesView'
import { useMatchFilters } from './hooks/useMatchFilters'
import { useTodayIST } from './hooks/useTodayIST'
import { ART_CREDIT } from './lib/heroArt'
import { addDaysToKey, formatDateKey, isValidDateKey } from './lib/time'

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

  const select = useCallback(
    (date: string) => navigate(date === today ? '/' : `/day/${date}`),
    [navigate, today],
  )

  return (
    <>
      <HeroBanner
        title={heroTitle(selectedDate, today)}
        subtitle={`${formatDateKey(selectedDate, 'EEEE, d MMMM yyyy')} · times in IST`}
      />
      <main className="mx-auto max-w-6xl px-4 pb-8 sm:pb-10">
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
      <div className="flex-1">
        <Routes>
          <Route element={<DayLayout />}>
            <Route path="/" element={<TodayRoute />} />
            <Route path="/day/:date" element={<DayRoute />} />
          </Route>
          <Route path="/tables/:code?" element={<TablesView />} />
          <Route path="/scorers/:code?" element={<ScorersView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <AppFooter />
      <Toaster />
    </div>
  )
}
