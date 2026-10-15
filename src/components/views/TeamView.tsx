import { useMemo, type ReactNode } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useFavourites } from '../../hooks/useFavourites'
import { useTeam, useTeamMatches } from '../../hooks/useTeam'
import { parseClubColors } from '../../lib/clubColors'
import { resultFor } from '../../lib/form'
import { downloadIcs } from '../../lib/ics'
import { matchesCalendar, slug } from '../../lib/matchActions'
import { statusKind } from '../../lib/matches'
import { showToast } from '../../lib/toast'
import type { FormResult, Match, TeamDetails } from '../../types/football'
import { Crest } from '../Crest'
import { FormPills } from '../FormPills'
import { CalendarIcon, StarIcon } from '../icons'
import { MatchCard } from '../MatchCard'
import { EmptyState, ErrorState, MatchListSkeleton } from '../States'

function ColourStripe({ colours }: { colours: string[] }) {
  const list = colours.length ? colours : ['var(--color-cobalt)']
  return (
    <div className="flex h-3 border-b-2 border-ink" aria-hidden>
      {list.map((c, i) => (
        <span key={i} className="flex-1" style={{ backgroundColor: c }} />
      ))}
    </div>
  )
}

export function FollowButton({ team }: { team: Pick<TeamDetails, 'id' | 'name' | 'shortName' | 'crest'> }) {
  const { isFollowing, toggle } = useFavourites()
  const following = isFollowing(team.id)
  return (
    <button
      type="button"
      aria-pressed={following}
      onClick={() => {
        toggle(team)
        showToast(following ? `Unfollowed ${team.shortName ?? team.name}` : `Following ${team.shortName ?? team.name}`)
      }}
      className={`flex h-10 items-center gap-2 rounded-md border-2 border-ink px-3 text-sm font-bold shadow-poster-sm transition-transform hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${
        following ? 'bg-gold text-ink' : 'bg-surface'
      }`}
    >
      <StarIcon className={`size-4 ${following ? '' : 'text-muted'}`} />
      {following ? 'Following' : 'Follow'}
    </button>
  )
}

function TeamHeader({ team, upcoming }: { team: TeamDetails; upcoming: Match[] }) {
  const meta = [team.venue, team.founded ? `Founded ${team.founded}` : null, team.area?.name].filter(Boolean).join(' · ')
  const exportFixtures = () => {
    downloadIcs(
      `${slug(team.shortName ?? team.name)}-fixtures.ics`,
      matchesCalendar(upcoming, window.location.origin, `${team.shortName ?? team.name} fixtures`),
    )
  }
  return (
    <div className="overflow-hidden rounded-md border-2 border-ink bg-surface shadow-poster">
      <ColourStripe colours={parseClubColors(team.clubColors)} />
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-6">
        <span className="flex size-20 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-white p-2 sm:size-24">
          <Crest src={team.crest} name={team.name} size={64} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-4xl leading-[0.95] tracking-wide sm:text-6xl">{team.name}</h1>
          {meta && <p className="mt-1 text-sm font-semibold text-muted">{meta}</p>}
          {team.clubColors && <p className="mt-0.5 text-xs text-muted">Colours: {team.clubColors}</p>}
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch">
          <FollowButton team={team} />
          <button
            type="button"
            onClick={exportFixtures}
            disabled={upcoming.length === 0}
            className="flex h-10 items-center gap-2 rounded-md border-2 border-ink bg-accent px-3 text-sm font-bold text-accent-fg shadow-poster-sm transition-transform hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted disabled:shadow-none"
          >
            <CalendarIcon className="size-4" />
            Add all fixtures to calendar
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 font-display text-3xl leading-none tracking-wide">{title}</h2>
      {children}
    </section>
  )
}

function CardGrid({ matches }: { matches: Match[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {matches.map((m) => (
        <MatchCard key={m.id} match={m} showCompetition />
      ))}
    </div>
  )
}

function TeamPage({ id }: { id: number }) {
  const team = useTeam(id)
  const teamMatches = useTeamMatches(id)

  const { upcoming, recent, form } = useMemo(() => {
    const venue = team.data?.venue
    // The match list has no venue; for this team's home games we know it.
    const matches = (teamMatches.data?.matches ?? []).map((m) => (venue && m.homeTeam.id === id ? { ...m, venue } : m))
    const finished = matches.filter((m) => statusKind(m.status) === 'finished')
    return {
      upcoming: matches.filter((m) => ['scheduled', 'live'].includes(statusKind(m.status))),
      recent: [...finished].reverse(),
      form: finished
        .map((m) => resultFor(m, id))
        .filter((r): r is FormResult => r !== null)
        .slice(-5),
    }
  }, [teamMatches.data, team.data?.venue, id])

  if (team.isPending) {
    return (
      <div className="mt-6 animate-pulse" aria-busy aria-label="Loading team">
        <div className="h-44 rounded-md border-2 border-ink bg-surface shadow-poster" />
      </div>
    )
  }
  if (!team.data) return <div className="mt-6"><ErrorState error={team.error} onRetry={() => team.refetch()} /></div>

  return (
    <div className="mt-6">
      <TeamHeader team={team.data} upcoming={upcoming.filter((m) => statusKind(m.status) === 'scheduled')} />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <h2 className="font-display text-2xl leading-none tracking-wide">Form</h2>
        {teamMatches.data ? (
          <>
            <FormPills form={form} size="md" />
            {form.length > 0 && <span className="text-xs text-muted">Last {form.length} results, oldest first</span>}
          </>
        ) : (
          <span className="h-7 w-40 animate-pulse rounded bg-surface-2" />
        )}
      </div>

      {teamMatches.isPending ? (
        <div className="mt-10"><MatchListSkeleton groups={1} /></div>
      ) : !teamMatches.data ? (
        <div className="mt-10"><ErrorState error={teamMatches.error} onRetry={() => teamMatches.refetch()} /></div>
      ) : (
        <>
          <Section title="Upcoming fixtures">
            {upcoming.length ? <CardGrid matches={upcoming} /> : <EmptyState title="No fixtures" hint="Nothing scheduled in the next 60 days." />}
          </Section>
          <Section title="Recent results">
            {recent.length ? <CardGrid matches={recent} /> : <EmptyState title="No results" hint="No finished matches in the last 30 days." />}
          </Section>
        </>
      )}
    </div>
  )
}

export function TeamView() {
  const { id } = useParams()
  const teamId = Number(id)
  if (!id || !/^[1-9]\d{0,8}$/.test(id)) return <Navigate to="/" replace />
  return (
    <main className="mx-auto max-w-6xl px-4 pb-10">
      <TeamPage key={teamId} id={teamId} />
    </main>
  )
}
