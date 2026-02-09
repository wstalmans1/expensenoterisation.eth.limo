interface SuccessOverlayProps {
  isVisible: boolean
  title?: string
  message?: string
  onClose: () => void
}

export function SuccessOverlay({
  isVisible,
  title,
  message,
  onClose,
}: SuccessOverlayProps) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 shadow-2xl">
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <span className="text-2xl font-bold text-emerald-700">✓</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-neutral-900">
              {title || 'Expense Saved'}
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              {message || 'Your expense has been recorded on-chain.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
