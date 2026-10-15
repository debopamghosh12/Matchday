import { useToast } from '../lib/toast'

/** Renders the current toast. The live region stays mounted so screen readers announce changes. */
export function Toaster() {
  const toast = useToast()
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
    >
      {toast && (
        <p
          key={toast.id}
          className="rounded-md border-2 border-ink bg-fg px-4 py-2 text-sm font-bold text-bg shadow-poster"
        >
          {toast.message}
        </p>
      )}
    </div>
  )
}
