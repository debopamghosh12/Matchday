import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AppHeader } from './components/AppHeader'
import { DayView } from './components/views/DayView'
import { useTodayIST } from './hooks/useTodayIST'
import { isValidDateKey } from './lib/time'

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
          <Route path="/" element={<TodayRoute />} />
          <Route path="/day/:date" element={<DayRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
