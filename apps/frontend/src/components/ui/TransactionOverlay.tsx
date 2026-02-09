interface TransactionOverlayProps {
  isVisible: boolean
  type: 'pending' | 'confirming'
  title?: string
  message?: string
}

export function TransactionOverlay({
  isVisible,
  type,
  title,
  message,
}: TransactionOverlayProps) {
  if (!isVisible) return null

  const defaultTitles = {
    pending: 'Waiting for Signature',
    confirming: 'Processing Transaction',
  }

  const defaultMessages = {
    pending:
      'Please confirm the transaction in your wallet. Check your mobile wallet if connected there.',
    confirming: 'Your transaction is being processed on-chain. Please wait...',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 shadow-2xl">
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-neutral-900">
              {title || defaultTitles[type]}
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              {message || defaultMessages[type]}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
