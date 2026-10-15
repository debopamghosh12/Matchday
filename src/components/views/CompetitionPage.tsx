import type { ReactNode } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useActiveCompetitions } from '../../hooks/useCompetitions'
import type { Competition } from '../../types/football'
import { CompetitionTabs } from '../CompetitionTabs'
import { PageHeading } from '../PageHeading'
import { ErrorState } from '../States'

const DEFAULT_CODE = 'PL'

interface CompetitionPageProps {
  title: string
  basePath: string
  tabsLabel: string
  children: (competition: Competition) => ReactNode
}

/**
 * Shared shell for /tables/:code and /scorers/:code: heading, one tab per
 * competition with a season in progress, and redirects for a missing or
 * unknown code.
 */
export function CompetitionPage({ title, basePath, tabsLabel, children }: CompetitionPageProps) {
  const { code } = useParams()
  const { data: competitions, error, refetch, isPending } = useActiveCompetitions()

  if (isPending) {
    return (
      <main className="mx-auto max-w-6xl px-4 pb-10">
        <PageHeading title={title} />
        <div className="h-10 w-full animate-pulse rounded-md bg-surface-2" aria-busy aria-label="Loading competitions" />
      </main>
    )
  }
  if (!competitions) {
    return (
      <main className="mx-auto max-w-6xl px-4 pb-10">
        <PageHeading title={title} />
        <ErrorState error={error} onRetry={() => refetch()} />
      </main>
    )
  }

  const current = competitions.find((c) => c.code === code?.toUpperCase())
  if (!current) {
    const fallback = competitions.find((c) => c.code === DEFAULT_CODE) ?? competitions[0]
    return fallback ? <Navigate to={`${basePath}/${fallback.code}`} replace /> : null
  }
  if (code !== current.code) return <Navigate to={`${basePath}/${current.code}`} replace />

  return (
    <main className="mx-auto max-w-6xl px-4 pb-10">
      <PageHeading title={title} subtitle={`${current.name} · ${current.currentSeason ? seasonLabel(current) : ''}`} />
      <div className="mb-6">
        <CompetitionTabs competitions={competitions} basePath={basePath} label={tabsLabel} />
      </div>
      {children(current)}
    </main>
  )
}

function seasonLabel(c: Competition): string {
  const start = c.currentSeason!.startDate.slice(0, 4)
  const end = c.currentSeason!.endDate.slice(0, 4)
  return start === end ? `${start} season` : `${start}/${end.slice(2)} season`
}
