import type { FormResult } from '../types/football'

const STYLE: Record<FormResult, string> = {
  W: 'bg-win text-cream',
  D: 'bg-draw text-ink',
  L: 'bg-flare text-ink',
}
const WORD: Record<FormResult, string> = { W: 'win', D: 'draw', L: 'loss' }

/** Last results as W/D/L pills, oldest first. */
export function FormPills({ form, size = 'sm' }: { form: FormResult[] | null; size?: 'sm' | 'md' }) {
  if (!form) return <span className="text-muted">–</span>
  if (form.length === 0) return <span className="text-xs text-muted">No games</span>
  const box = size === 'md' ? 'size-7 text-sm' : 'size-4 text-[9px] sm:size-[18px] sm:text-[10px]'
  return (
    <span role="img" className="inline-flex gap-px sm:gap-0.5" aria-label={`Last ${form.length}, oldest first: ${form.map((r) => WORD[r]).join(', ')}`}>
      {form.map((result, i) => (
        <span
          key={i}
          aria-hidden
          className={`inline-flex items-center justify-center rounded-sm border border-ink font-bold ${box} ${STYLE[result]}`}
        >
          {result}
        </span>
      ))}
    </span>
  )
}
