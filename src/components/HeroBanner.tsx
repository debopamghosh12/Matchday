import { useEffect, useState, type ReactNode } from 'react'
import { usePageVisible } from '../hooks/usePageVisible'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { HERO_ART, HERO_SIZES, heroSrcSet } from '../lib/heroArt'

const ROTATE_MS = 6000

/**
 * Calls `done` once `img` is on screen. Where the browser reports largest-contentful-
 * paint (Chromium) we wait for that entry, which is dispatched after the frame is
 * presented; elsewhere, after decoding plus two animation frames.
 */
function whenPainted(img: HTMLImageElement, done: () => void) {
  let called = false
  const finish = () => {
    if (called) return
    called = true
    done()
  }
  if (PerformanceObserver.supportedEntryTypes?.includes('largest-contentful-paint')) {
    const observer = new PerformanceObserver((list) => {
      if (list.getEntries().some((e) => (e as PerformanceEntry & { element?: Element }).element === img)) {
        observer.disconnect()
        finish()
      }
    })
    observer.observe({ type: 'largest-contentful-paint', buffered: true })
    // Not every paint becomes an LCP entry (e.g. something larger came first); don't wait forever.
    setTimeout(() => {
      observer.disconnect()
      finish()
    }, 1000)
    return
  }
  void img
    .decode()
    .catch(() => undefined)
    .then(() => requestAnimationFrame(() => requestAnimationFrame(finish)))
}

interface HeroBannerProps {
  title: ReactNode
  subtitle?: ReactNode
  /** Called once the first image has decoded and been painted. */
  onFirstPaint?: () => void
}

/**
 * Full-width artwork banner that crossfades through HERO_ART every 6s.
 * Only the first image loads up front; each next one is mounted (and so fetched)
 * once the current one has loaded, and the fade waits until it has loaded too.
 * Pauses while the tab is hidden; with reduced motion it shows the first image only.
 */
export function HeroBanner({ title, subtitle, onFirstPaint }: HeroBannerProps) {
  const reducedMotion = useReducedMotion()
  const visible = usePageVisible()
  const rotating = !reducedMotion && HERO_ART.length > 1

  const [index, setIndex] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const [loaded, setLoaded] = useState<ReadonlySet<number>>(() => new Set())

  const next = (index + 1) % HERO_ART.length
  const current = rotating ? index : 0
  const nextReady = loaded.has(next)

  useEffect(() => {
    if (!rotating || !visible || !nextReady) return
    const id = setTimeout(() => {
      setPrev(index)
      setIndex(next)
    }, ROTATE_MS)
    return () => clearTimeout(id)
  }, [rotating, visible, nextReady, index, next])

  const markLoaded = (i: number) => setLoaded((s) => (s.has(i) ? s : new Set(s).add(i)))

  const onLoad = (i: number, img: HTMLImageElement) => {
    markLoaded(i)
    if (i === 0 && onFirstPaint) whenPainted(img, onFirstPaint)
  }

  return (
    <div className="relative h-[200px] overflow-hidden bg-bg sm:h-[280px]">
      {/*
        Art panel: full width on phones; on wider screens it sits on the right (capped, so the
        portrait art isn't blown up into a sliver of face) and fades into the page on its left.
      */}
      <div className="absolute inset-y-0 right-0 w-full sm:w-[62%] sm:max-w-[900px] sm:[mask-image:linear-gradient(to_right,transparent,black_40%)]">
        {HERO_ART.map((art, i) => {
          // Render: the current image, the previous (under the fade), the next (preloading,
          // but only once the current one has loaded so they don't compete for bandwidth),
          // and anything already loaded so returning to it doesn't refetch.
          const mounted =
            i === current || (rotating && (i === prev || (i === next && loaded.has(current)) || loaded.has(i)))
          if (!mounted) return null
          const layer = i === current ? 'z-[2] opacity-100' : i === prev ? 'z-[1] opacity-100' : 'z-0 opacity-0'
          return (
            <img
              key={art.file}
              src={`/art/webp/${art.file}-800.webp`}
              srcSet={heroSrcSet(art.file)}
              sizes={HERO_SIZES}
              alt=""
              // The first image is the page's largest paint: decode it with the first frame.
              decoding={i === 0 ? 'sync' : 'async'}
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : 'low'}
              onLoad={(e) => onLoad(i, e.currentTarget)}
              style={{ objectPosition: art.position }}
              className={`absolute inset-0 size-full object-cover transition-opacity duration-[1800ms] ease-in-out ${layer}`}
            />
          )
        })}
      </div>

      {/* Blend into the page: fade to the background at the bottom, and behind the title on phones. */}
      <div className="absolute inset-0 z-[3] bg-linear-to-b from-transparent from-15% via-bg/85 via-55% to-bg sm:from-35% sm:via-bg/70 sm:via-70%" aria-hidden />
      <div className="absolute inset-0 z-[3] bg-linear-to-r from-bg/80 via-bg/30 via-50% to-transparent to-80% sm:hidden" aria-hidden />

      <div className="relative z-[4] mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-3 sm:pb-5">
        <h1 className="font-display text-5xl leading-[0.9] tracking-wide sm:text-7xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm font-semibold sm:text-base">{subtitle}</p>}
      </div>
    </div>
  )
}
