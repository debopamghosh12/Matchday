import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { TeamRef } from '../types/football'

const TEAM_PAGES = false

interface TeamLinkProps {
  team: Pick<TeamRef, 'id'>
  className?: string
  children: ReactNode
}

/** Links a team's name/crest to its team page (plain text when the team is unknown, e.g. TBD). */
export function TeamLink({ team, className = '', children }: TeamLinkProps) {
  // Team pages land in the next phase; until then this renders plain text.
  if (team.id === null || !TEAM_PAGES) return <span className={className}>{children}</span>
  return (
    <Link
      to={`/team/${team.id}`}
      className={`rounded-sm hover:underline hover:underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight ${className}`}
    >
      {children}
    </Link>
  )
}
