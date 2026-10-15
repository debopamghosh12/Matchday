import { useRef } from 'react'
import { isValidDateKey } from '../lib/time'

interface DatePickerButtonProps {
  value: string
  onSelect: (date: string) => void
}

/** Calendar button that opens the native date picker, for jumps beyond the slider. */
export function DatePickerButton({ value, onSelect }: DatePickerButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const open = () => {
    const input = inputRef.current
    if (!input) return
    try {
      input.showPicker()
    } catch {
      input.focus() // older browsers: focusing still lets the user type a date
    }
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={open}
        className="flex h-10 items-center gap-2 rounded-md border-2 border-ink bg-surface px-3 text-sm font-bold shadow-poster-sm transition-transform hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="size-4" aria-hidden>
          <path
            fillRule="evenodd"
            d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z"
            clipRule="evenodd"
          />
        </svg>
        <span>Pick date</span>
      </button>
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => isValidDateKey(e.target.value) && onSelect(e.target.value)}
        aria-label="Jump to date"
        tabIndex={-1}
        className="pointer-events-none absolute inset-0 opacity-0"
      />
    </div>
  )
}
