import { useState } from 'react'

interface CrestProps {
  src: string | null
  name: string
  size?: number
  className?: string
}

/** Team crest or competition emblem, with an initials fallback. */
export function Crest({ src, name, size = 24, className = '' }: CrestProps) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    const initials = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
    return (
      <span
        aria-hidden
        style={{ width: size, height: size, fontSize: size * 0.38 }}
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-surface-2 font-semibold text-muted ${className}`}
      >
        {initials || '?'}
      </span>
    )
  }

  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{ width: size, height: size }}
      className={`shrink-0 object-contain ${className}`}
    />
  )
}
