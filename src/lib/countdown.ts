/**
 * Countdown label for a scheduled match: "Starts in 2h 14m", "Starts in 34m",
 * "Starts in 3d 4h" when more than a day away, and "Kicking off" once the
 * kick-off time has passed (until the API reports the match in play).
 * Minutes round up, so the label never says 0m before kick-off.
 */
export function formatCountdown(kickoff: Date | string | number, now: number): string {
  const ms = new Date(kickoff).getTime() - now
  if (ms <= 0) return 'Kicking off'
  const totalMinutes = Math.ceil(ms / 60_000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  if (days > 0) return `Starts in ${days}d ${hours}h`
  if (hours > 0) return `Starts in ${hours}h ${minutes}m`
  return `Starts in ${minutes}m`
}
