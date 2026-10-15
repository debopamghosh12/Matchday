import type { ReactNode } from 'react'

/** Big display-font title for pages without the artwork hero. */
export function PageHeading({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="mt-6 mb-5 sm:mt-8">
      <h1 className="font-display text-5xl leading-[0.9] tracking-wide sm:text-6xl">{title}</h1>
      {subtitle && <p className="mt-1.5 text-sm font-semibold text-muted sm:text-base">{subtitle}</p>}
    </div>
  )
}
