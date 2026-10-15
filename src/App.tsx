import { useCallback } from 'react'
import { Navigate, Outlet, Route, Routes, useMatch, useNavigate, useParams } from 'react-router-dom'
import { AppHeader } from './components/AppHeader'
import { DatePickerButton } from './components/DatePickerButton'
import { DateSlider } from './components/DateSlider'
import { DayView } from './components/views/DayView'
import { useTodayIST } from './hooks/useTodayIST'
import { isValidDateKey } from './lib/time'

/** Today + /day/:date share this layout so the date slider stays mounted between days. */
function DayLayout() {
  const today = useTodayIST()
  const navigate = useNavigate()
  const dayMatch = useMatch('/day/:date')
  const param = dayMatch?.params.date
  const selectedDate = isValidDateKey(param) ? param : today

  const select = useCallback(
    (date: string) => navigate(date === today ? '/' : `/day/${date}`),
    [navigate, today],
  )

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <DateSlider selectedDate={selectedDate} onSelect={select} />
        </div>
        <div className="hidden sm:block">
          <DatePickerButton value={selectedDate} onSelect={select} />
        </div>
      </div>
      <Outlet />
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

export default function App() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Routes>
          <Route element={<DayLayout />}>
            <Route path="/" element={<TodayRoute />} />
            <Route path="/day/:date" element={<DayRoute />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
