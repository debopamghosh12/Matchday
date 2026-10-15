import type { Match } from '../types/football'
import { matchShareText, matchTitle } from './matchActions'

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

/** Native share sheet when available, otherwise copy the share text to the clipboard. */
export async function shareMatch(match: Match, origin = window.location.origin): Promise<ShareResult> {
  const text = matchShareText(match, origin)
  if (typeof navigator.share === 'function') {
    try {
      // `text` already ends with the link; passing `url` too would duplicate it in most targets.
      await navigator.share({ title: matchTitle(match), text })
      return 'shared'
    } catch (err) {
      if ((err as Error).name === 'AbortError') return 'cancelled'
      // Fall through to the clipboard (e.g. share blocked by permissions policy).
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
