import { useCallback, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { matchesQueryOptions } from '../hooks/useMatches'
import { useTodayIST } from '../hooks/useTodayIST'
import { groupByIstDate } from '../lib/matches'
import { addDaysToKey, formatDateKey } from '../lib/time'

// Initial window around the selected date: 29 IST days = a 30-day UTC window
// on the server, i.e. exactly 3 upstream calls of 10 days.
const DAYS_BEFORE = 7
const DAYS_AFTER = 21
// Each extension adds 9 IST days = a 10-day UTC window = 1 upstream call.
const EXTEND_DAYS = 9

// 50% of the strip minus half a pill (w-14 = 3.5rem) and one gap (0.5rem).
const EDGE_SPACER = 'w-[calc(50%-2.25rem)] shrink-0'

type Range = readonly [from: string, to: string]

interface DateSliderProps {
  /** Selected IST date (yyyy-MM-dd). */
  selectedDate: string
  onSelect: (date: string) => void
}

function initialRanges(date: string): Range[] {
  return [[addDaysToKey(date, -DAYS_BEFORE), addDaysToKey(date, DAYS_AFTER)]]
}

function daysBetween(from: string, to: string): string[] {
  const days: string[] = []
  for (let d = from; d <= to; d = addDaysToKey(d, 1)) days.push(d)
  return days
}

/**
 * Horizontal strip of day pills with match counts. Loads counts for its whole
 * range with one /api/matches call per loaded block and extends the range when
 * scrolled to either end. Arrow keys move the selection when focused.
 */
export function DateSlider({ selectedDate, onSelect }: DateSliderProps) {
  const today = useTodayIST()
  // `id` changes only when the window is rebuilt around a far-away date.
  const [win, setWin] = useState(() => ({ id: 0, ranges: initialRanges(selectedDate) }))
  const { ranges } = win
  const start = ranges[0][0]
  const end = ranges[ranges.length - 1][1]

  // Selection left the loaded days. Adjust during render (not in an effect) so
  // the new range query exists before the day list below looks for one;
  // otherwise it would fetch the single day separately.
  if (selectedDate > end || selectedDate < start) {
    if (selectedDate === addDaysToKey(end, 1)) {
      // Stepped one past the end (keyboard): extend.
      setWin((w) => ({ ...w, ranges: [...w.ranges, [selectedDate, addDaysToKey(selectedDate, EXTEND_DAYS - 1)]] }))
    } else if (selectedDate === addDaysToKey(start, -1)) {
      setWin((w) => ({ ...w, ranges: [[addDaysToKey(selectedDate, -(EXTEND_DAYS - 1)), selectedDate], ...w.ranges] }))
    } else {
      // Far jump (date picker, URL): new window around it.
      setWin((w) => ({ id: w.id + 1, ranges: initialRanges(selectedDate) }))
    }
  }

  const scrollerRef = useRef<HTMLDivElement>(null)
  // What we last centred on, to centre only when the selection or window changes.
  const lastCentred = useRef<{ date: string; id: number } | null>(null)
  // While we scroll programmatically (centring, prepend fix-up), scroll events
  // must not count as the user reaching an end. Cleared on `scrollend`, with a
  // timeout fallback for browsers that don't fire it.
  const programmaticUntil = useRef(0)
  const markProgrammatic = () => {
    programmaticUntil.current = Date.now() + 1500
  }
  // Where the old first pill sat in the viewport before days were prepended.
  const prependAnchor = useRef<{ date: string; x: number } | null>(null)

  // --- data -----------------------------------------------------------------
  const rangeQueries = useQueries({
    queries: ranges.map(([from, to]) => matchesQueryOptions(from, to, false)),
  })
  // Today's own live query (owned by the Today list) has the freshest count.
  const todayLive = useQuery({ ...matchesQueryOptions(today, today, true), enabled: false })

  const counts = useMemo(() => {
    const result = new Map<string, number | 'loading' | 'error'>()
    ranges.forEach(([from, to], i) => {
      const q = rangeQueries[i]
      const byDate = q.data ? groupByIstDate(q.data.matches) : null
      for (const day of daysBetween(from, to)) {
        result.set(day, byDate ? (byDate.get(day)?.length ?? 0) : q.isError ? 'error' : 'loading')
      }
    })
    if (todayLive.data && result.has(today)) {
      result.set(today, groupByIstDate(todayLive.data.matches).get(today)?.length ?? 0)
    }
    return result
  }, [ranges, rangeQueries, todayLive.data, today])

  const days = useMemo(() => daysBetween(start, end), [start, end])

  // --- range management ------------------------------------------------------
  const firstPending = rangeQueries[0]?.isPending
  const lastPending = rangeQueries[rangeQueries.length - 1]?.isPending

  // Scroll-triggered extensions: one at a time per side, so a fast fling
  // can't fire a burst of requests at the rate limit.
  const extendEnd = useCallback(() => {
    if (lastPending) return
    setWin((w) => {
      const last = w.ranges[w.ranges.length - 1][1]
      return { ...w, ranges: [...w.ranges, [addDaysToKey(last, 1), addDaysToKey(last, EXTEND_DAYS)]] }
    })
  }, [lastPending])

  const extendStart = useCallback(() => {
    if (firstPending) return
    const scroller = scrollerRef.current
    const pill = scroller?.querySelector<HTMLElement>(`[data-date="${start}"]`)
    if (scroller && pill) prependAnchor.current = { date: start, x: pill.offsetLeft - scroller.scrollLeft }
    setWin((w) => {
      const first = w.ranges[0][0]
      return { ...w, ranges: [[addDaysToKey(first, -EXTEND_DAYS), addDaysToKey(first, -1)], ...w.ranges] }
    })
  }, [firstPending, start])

  // Keep visible pills still when days are prepended: put the old first pill
  // back where it was. Setting an absolute position (not adding a delta) is
  // correct whether or not the browser already compensated (Chrome re-snaps
  // to the snapped pill; scroll anchoring is off via overflow-anchor: none).
  useLayoutEffect(() => {
    const scroller = scrollerRef.current
    const anchor = prependAnchor.current
    if (!scroller || !anchor) return
    const pill = scroller.querySelector<HTMLElement>(`[data-date="${anchor.date}"]`)
    if (pill) {
      markProgrammatic()
      scroller.scrollLeft = pill.offsetLeft - anchor.x
    }
    prependAnchor.current = null
  }, [start])

  // --- scrolling --------------------------------------------------------------
  const centreOn = useCallback((date: string, smooth: boolean) => {
    const scroller = scrollerRef.current
    const pill = scroller?.querySelector<HTMLElement>(`[data-date="${date}"]`)
    if (!scroller || !pill) return
    const left = pill.offsetLeft - (scroller.clientWidth - pill.offsetWidth) / 2
    markProgrammatic()
    scroller.scrollTo({ left: Math.max(0, left), behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  // Centre the selected pill when the selection changes: instantly on first
  // render or a new window, smoothly otherwise. Extending the strip doesn't recentre.
  useLayoutEffect(() => {
    const prev = lastCentred.current
    if (prev?.date === selectedDate && prev.id === win.id) return
    centreOn(selectedDate, prev?.id === win.id)
    lastCentred.current = { date: selectedDate, id: win.id }
    // Keep keyboard focus on the selected pill while navigating with arrows.
    const scroller = scrollerRef.current
    if (scroller?.contains(document.activeElement)) {
      scroller.querySelector<HTMLElement>(`[data-date="${selectedDate}"]`)?.focus({ preventScroll: true })
    }
  }, [selectedDate, win.id, centreOn])

  const onScroll = () => {
    const scroller = scrollerRef.current
    if (!scroller || Date.now() < programmaticUntil.current) return
    const threshold = 120
    if (scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - threshold) extendEnd()
    else if (scroller.scrollLeft <= threshold) extendStart()
  }

  const scrollByPage = (direction: -1 | 1) => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const atStart = scroller.scrollLeft <= 1
    const atEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 1
    if (direction === 1 && atEnd) return extendEnd()
    if (direction === -1 && atStart) return extendStart()
    scroller.scrollBy({ left: direction * scroller.clientWidth * 0.75, behavior: 'smooth' })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      onSelect(addDaysToKey(selectedDate, e.key === 'ArrowLeft' ? -1 : 1))
    }
  }

  return (
    <div className="relative -mx-4 sm:mx-0">
      <ArrowButton direction={-1} onClick={() => scrollByPage(-1)} />

      <div
        ref={scrollerRef}
        role="group"
        aria-label="Choose a day"
        onScroll={onScroll}
        onScrollEnd={() => (programmaticUntil.current = 0)}
        onKeyDown={onKeyDown}
        className="no-scrollbar relative flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 py-2 [overflow-anchor:none] [mask-image:linear-gradient(to_right,transparent,black_1.5rem,black_calc(100%-1.5rem),transparent)] sm:mx-11 sm:snap-proximity sm:px-1"
      >
        {/* Half-width spacers let the first/last pills scroll to the centre too. */}
        <span className={EDGE_SPACER} aria-hidden />
        {days.map((day) => (
          <DayPill
            key={day}
            date={day}
            count={counts.get(day) ?? 'loading'}
            isSelected={day === selectedDate}
            isToday={day === today}
            onClick={() => onSelect(day)}
          />
        ))}
        <span className={EDGE_SPACER} aria-hidden />
      </div>

      <ArrowButton direction={1} onClick={() => scrollByPage(1)} />
    </div>
  )
}

interface DayPillProps {
  date: string
  count: number | 'loading' | 'error'
  isSelected: boolean
  isToday: boolean
  onClick: () => void
}

function DayPill({ date, count, isSelected, isToday, onClick }: DayPillProps) {
  const empty = count === 0
  const label = [
    isToday ? 'Today,' : '',
    formatDateKey(date, 'EEEE d MMMM'),
    typeof count === 'number' ? `, ${count} ${count === 1 ? 'match' : 'matches'}` : '',
  ].join(' ')

  return (
    <button
      type="button"
      data-date={date}
      onClick={onClick}
      tabIndex={isSelected ? 0 : -1}
      aria-current={isSelected ? 'date' : undefined}
      aria-label={label.trim()}
      className={`relative flex w-14 shrink-0 snap-center flex-col items-center rounded-md border-2 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight ${
        isSelected
          ? 'border-ink bg-accent text-accent-fg shadow-poster-sm'
          : empty
            ? 'border-dashed border-line text-muted hover:border-ink' // no matches: quieter, but still AA-readable
            : 'border-ink bg-surface hover:bg-surface-2'
      }`}
    >
      <span
        className={`text-[10px] font-semibold uppercase tracking-wide ${
          isToday ? (isSelected ? '' : 'text-highlight') : isSelected ? '' : 'text-muted'
        }`}
      >
        {isToday ? 'Today' : formatDateKey(date, 'EEE')}
      </span>
      <span className="font-display text-2xl leading-6 tracking-wide tabular-nums">{formatDateKey(date, 'd')}</span>
      <span className={`text-[10px] font-semibold uppercase ${isSelected ? '' : 'text-muted'}`}>
        {formatDateKey(date, 'MMM')}
      </span>

      {/* Fixed-height badge slot so counts loading in never shift the layout. */}
      <span className="mt-1 flex h-4 items-center">
        {count === 'loading' ? (
          <span className="h-3.5 w-5 animate-pulse rounded-full bg-surface-2" aria-hidden />
        ) : typeof count === 'number' && count > 0 ? (
          <span
            className={`min-w-5 rounded-full px-1.5 text-center text-[10px] leading-4 font-bold tabular-nums ${
              isSelected ? 'bg-ink text-cream' : 'bg-surface-2 text-fg'
            }`}
          >
            {count}
          </span>
        ) : null}
      </span>

      {isToday && !isSelected && (
        <span className="absolute -top-1.5 -right-1.5 size-3 rounded-full border-2 border-ink bg-gold" aria-hidden />
      )}
    </button>
  )
}

function ArrowButton({ direction, onClick }: { direction: -1 | 1; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === -1 ? 'Scroll to earlier days' : 'Scroll to later days'}
      className={`absolute top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-md border-2 border-ink bg-surface shadow-poster-sm transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight sm:flex ${
        direction === -1 ? 'left-0' : 'right-0'
      }`}
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="size-4" aria-hidden>
        <path
          fillRule="evenodd"
          d={
            direction === -1
              ? 'M12.79 5.23a.75.75 0 0 1-.02 1.06L8.83 10l3.94 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z'
              : 'M7.21 14.77a.75.75 0 0 1 .02-1.06L11.17 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z'
          }
          clipRule="evenodd"
        />
      </svg>
    </button>
  )
}
