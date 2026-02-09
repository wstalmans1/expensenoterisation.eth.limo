import { useEffect, useMemo, useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useQueryClient } from '@tanstack/react-query'
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { isAddress } from 'viem'
import { expenseRegistryAbi } from './contracts/expenseRegistryAbi'
import {
  EXPENSE_REGISTRY_ADDRESS,
  EXPENSE_REGISTRY_IMPLEMENTATION_ADDRESS,
} from './constants/contracts'
import { invalidateExpenses } from './lib/scopes'
import { TransactionOverlay } from './components/ui/TransactionOverlay'
import { ModalManager } from './components/ui/ModalManager'
import { useModalStore } from './stores/modalStore'

function formatDate(seconds: bigint) {
  const date = new Date(Number(seconds) * 1000)
  if (Number.isNaN(date.getTime())) return 'Invalid date'
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

function formatAmount(amount: bigint) {
  return amount.toString()
}

export default function App() {
  const { address, isConnected } = useAccount()
  const queryClient = useQueryClient()
  const { open } = useModalStore()

  const [date, setDate] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [lookupInput, setLookupInput] = useState('')
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = window.localStorage.getItem('expense-theme')
    if (stored) return stored === 'dark'
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('expense-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const theme = useMemo(
    () => ({
      page: isDark
        ? 'min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-100'
        : 'min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-slate-100 text-neutral-900',
      kicker: isDark ? 'text-slate-400' : 'text-neutral-500',
      heading: isDark ? 'text-slate-100' : 'text-neutral-900',
      body: isDark ? 'text-slate-200' : 'text-neutral-600',
      subheading: isDark ? 'text-slate-200' : 'text-neutral-700',
      section: isDark
        ? 'border-white/10 bg-slate-900/70 text-slate-200'
        : 'border-black/10 bg-white/70 text-neutral-600',
      panel: isDark
        ? 'border-white/10 bg-slate-900/80'
        : 'border-black/10 bg-white/80',
      input: isDark
        ? 'border-white/10 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-slate-400'
        : 'border-black/10 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400',
      link: isDark ? 'text-amber-300' : 'text-amber-700',
      card: isDark ? 'border-white/10 bg-slate-950/60' : 'border-black/5 bg-white',
      note: isDark
        ? 'border-white/10 bg-slate-900/60 text-slate-300'
        : 'border-neutral-200 bg-neutral-50 text-neutral-600',
      warning: isDark
        ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
        : 'border-amber-200 bg-amber-50 text-amber-900',
      error: isDark
        ? 'border-red-500/40 bg-red-500/10 text-red-100'
        : 'border-red-200 bg-red-50 text-red-700',
      button: isDark
        ? 'bg-amber-800 text-slate-200 hover:bg-amber-700'
        : 'bg-neutral-900 text-white hover:bg-neutral-800',
      muted: isDark ? 'text-slate-500' : 'text-neutral-400',
    }),
    [isDark]
  )

  const hasContract = Boolean(EXPENSE_REGISTRY_ADDRESS)
  const contractAddress =
    EXPENSE_REGISTRY_ADDRESS ??
    ('0x0000000000000000000000000000000000000000' as const)

  const blockscoutBase = 'https://eth-sepolia.blockscout.com/address/'

  const expenseArgs = useMemo(() => {
    if (!address) return undefined
    return [address] as const
  }, [address])

  const {
    data: expenses,
    isLoading,
    isFetching,
    error: readError,
  } = useReadContract({
    address: contractAddress,
    abi: expenseRegistryAbi,
    functionName: 'getExpenses',
    args: expenseArgs,
    query: {
      enabled: Boolean(address && hasContract),
      staleTime: 20_000,
      gcTime: 300_000,
    },
  })

  const lookupAddress = useMemo(() => {
    const trimmed = lookupInput.trim()
    if (!trimmed) return undefined
    return isAddress(trimmed) ? (trimmed as `0x${string}`) : undefined
  }, [lookupInput])

  const {
    data: lookupExpenses,
    isLoading: lookupLoading,
    error: lookupReadError,
  } = useReadContract({
    address: contractAddress,
    abi: expenseRegistryAbi,
    functionName: 'getExpenses',
    args: lookupAddress ? ([lookupAddress] as const) : undefined,
    query: {
      enabled: Boolean(lookupAddress && hasContract),
      staleTime: 20_000,
      gcTime: 300_000,
    },
  })

  const {
    writeContract,
    data: txHash,
    isPending,
    error: writeError,
  } = useWriteContract()

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  useEffect(() => {
    if (!isConfirmed || !address) return

    invalidateExpenses(queryClient)
    open('txSuccess', {
      title: 'Expense Saved',
      message: 'Your expense has been recorded on-chain.',
    })

    setDate('')
    setAmount('')
    setDescription('')
  }, [address, isConfirmed, open, queryClient])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (!address) {
      setFormError('Connect your wallet to register an expense.')
      return
    }

    if (!hasContract || !EXPENSE_REGISTRY_ADDRESS) {
      setFormError('Contract address is missing. Check your .env.local setup.')
      return
    }

    if (!date) {
      setFormError('Please select a date.')
      return
    }

    const parsedDate = Date.parse(date)
    if (Number.isNaN(parsedDate)) {
      setFormError('Please provide a valid date.')
      return
    }

    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount < 0) {
      setFormError('Please provide a valid amount.')
      return
    }

    if (!description.trim()) {
      setFormError('Please provide a short description.')
      return
    }

    const dateSeconds = BigInt(Math.floor(parsedDate / 1000))
    const amountValue = BigInt(Math.floor(numericAmount))

    writeContract({
      address: EXPENSE_REGISTRY_ADDRESS,
      abi: expenseRegistryAbi,
      functionName: 'addExpense',
      args: [dateSeconds, amountValue, description.trim()],
    })
  }

  return (
    <div className={theme.page}>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p
              className={`text-xs uppercase tracking-[0.3em] ${theme.kicker}`}
            >
              On-chain expense log
            </p>
            <h1
              className={`text-3xl font-semibold md:text-4xl ${theme.heading}`}
            >
              Expense Notarisation
            </h1>
            <p className={`max-w-xl text-sm ${theme.body}`}>
              Register and check expenses on-chain.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              aria-pressed={isDark}
              aria-label="Toggle dark theme"
              className={`relative inline-flex h-8 w-14 items-center rounded-full border p-1 transition ${
                isDark
                  ? 'border-white/15 bg-slate-900'
                  : 'border-black/10 bg-white/70'
              }`}
            >
              <span
                className={`h-6 w-6 transform rounded-full shadow-sm transition ${
                  isDark ? 'translate-x-6 bg-amber-300' : 'translate-x-0 bg-neutral-900'
                }`}
              />
            </button>
            <span className={`text-xs font-semibold ${theme.kicker}`}>
              {isDark ? 'Dark' : 'Light'}
            </span>
            <ConnectButton />
          </div>
        </header>

        <section
          className={`mt-6 rounded-3xl border px-6 py-4 text-xs ${theme.section}`}
        >
          <div className={`mb-3 font-semibold ${theme.subheading}`}>
            Network: Sepolia (ID 11155111)
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <span className={`font-semibold ${theme.subheading}`}>Proxy:</span>{' '}
              {EXPENSE_REGISTRY_ADDRESS ? (
                <a
                  href={`${blockscoutBase}${EXPENSE_REGISTRY_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`font-mono underline-offset-2 transition hover:underline ${theme.link}`}
                >
                  {EXPENSE_REGISTRY_ADDRESS}
                </a>
              ) : (
                <span className="font-mono">Not set</span>
              )}
            </div>
            <div>
              <span className={`font-semibold ${theme.subheading}`}>
                Implementation:
              </span>{' '}
              {EXPENSE_REGISTRY_IMPLEMENTATION_ADDRESS ? (
                <a
                  href={`${blockscoutBase}${EXPENSE_REGISTRY_IMPLEMENTATION_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`font-mono underline-offset-2 transition hover:underline ${theme.link}`}
                >
                  {EXPENSE_REGISTRY_IMPLEMENTATION_ADDRESS}
                </a>
              ) : (
                <span className="font-mono">Not set</span>
              )}
            </div>
          </div>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
          <section
            className={`rounded-3xl border p-6 shadow-sm backdrop-blur ${theme.panel}`}
          >
            <h2 className={`text-lg font-semibold ${theme.heading}`}>
              Register expense
            </h2>
            <p className={`mt-1 text-sm ${theme.body}`}>
              Store date, amount, and a short description on-chain.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-3">
                <label
                  className={`text-xs font-semibold uppercase tracking-wide ${theme.kicker}`}
                >
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm shadow-sm outline-none transition ${theme.input}`}
                />
              </div>

              <div className="grid gap-3">
                <label
                  className={`text-xs font-semibold uppercase tracking-wide ${theme.kicker}`}
                >
                  Amount (EUR, integer)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="120"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm shadow-sm outline-none transition ${theme.input}`}
                />
              </div>

              <div className="grid gap-3">
                <label
                  className={`text-xs font-semibold uppercase tracking-wide ${theme.kicker}`}
                >
                  Description
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Lunch with team"
                  className={`w-full resize-none rounded-2xl border px-4 py-3 text-sm shadow-sm outline-none transition ${theme.input}`}
                />
              </div>

              {formError && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${theme.warning}`}
                >
                  {formError}
                </div>
              )}

              {writeError && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${theme.error}`}
                >
                  {writeError.message}
                </div>
              )}

              <button
                type="submit"
                disabled={!isConnected || isPending || isConfirming}
                className={`inline-flex w-full items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${theme.button}`}
              >
                {isPending
                  ? 'Waiting for signature...'
                  : isConfirming
                  ? 'Confirming on-chain...'
                  : 'Save expense'}
              </button>

              {!hasContract && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-xs ${theme.note}`}
                >
                  Contract address missing. Deploy the contract and set
                  VITE_EXPENSE_REGISTRY_ADDRESS.
                </div>
              )}
            </form>
          </section>

          <section
            className={`rounded-3xl border p-6 shadow-sm backdrop-blur ${theme.panel}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-lg font-semibold ${theme.heading}`}>
                  Your past expenses
                </h2>
                <p className={`mt-1 text-sm ${theme.body}`}>
                  Your on-chain history appears here.
                </p>
              </div>
              {isFetching && (
                <span className={`text-xs font-semibold ${theme.kicker}`}>
                  Updating...
                </span>
              )}
            </div>

            <div className="mt-6 space-y-3">
              {!isConnected && (
                <div
                  className={`rounded-2xl border border-dashed px-4 py-6 text-sm ${theme.note}`}
                >
                  Connect a wallet to see your expense list.
                </div>
              )}

              {isConnected && readError && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${theme.error}`}
                >
                  {readError.message}
                </div>
              )}

              {isConnected && isLoading && (
                <div
                  className={`rounded-2xl border px-4 py-6 text-sm ${theme.note}`}
                >
                  Loading expenses...
                </div>
              )}

              {isConnected && !isLoading && expenses?.length === 0 && (
                <div
                  className={`rounded-2xl border px-4 py-6 text-sm ${theme.note}`}
                >
                  No expenses recorded yet.
                </div>
              )}

              {isConnected && !isLoading && expenses && expenses.length > 0 && (
                <div className="space-y-3">
                  {expenses
                    .map((expense, index) => ({
                      expense,
                      index,
                    }))
                    .reverse()
                    .map(({ expense, index }) => (
                      <div
                        key={`${index}-${expense.date.toString()}`}
                        className={`rounded-2xl border px-5 py-4 shadow-sm ${theme.card}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p
                              className={`text-sm font-semibold ${theme.heading}`}
                            >
                              {expense.description}
                            </p>
                            <p className={`mt-1 text-xs ${theme.kicker}`}>
                              {formatDate(expense.date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-sm font-semibold ${theme.heading}`}
                            >
                              {formatAmount(expense.amount)} EUR
                            </p>
                            <p
                              className={`mt-1 text-[10px] uppercase tracking-[0.2em] ${theme.muted}`}
                            >
                              &nbsp;
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </section>

          <section
            className={`rounded-3xl border p-6 shadow-sm backdrop-blur ${theme.panel}`}
          >
            <h2 className={`text-lg font-semibold ${theme.heading}`}>
              Lookup expenses by address
            </h2>
            <p className={`mt-1 text-sm ${theme.body}`}>
              Paste any account to view its recorded expenses.
            </p>

            <div className="mt-5 space-y-3">
              <input
                type="text"
                value={lookupInput}
                onChange={(event) => setLookupInput(event.target.value)}
                placeholder="0x..."
                className={`w-full rounded-2xl border px-4 py-3 text-sm shadow-sm outline-none transition ${theme.input}`}
              />

              {lookupInput.trim().length > 0 && !lookupAddress && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${theme.warning}`}
                >
                  Enter a valid 0x address to load expenses.
                </div>
              )}

              {lookupReadError && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${theme.error}`}
                >
                  {lookupReadError.message}
                </div>
              )}

              {lookupAddress && lookupLoading && (
                <div
                  className={`rounded-2xl border px-4 py-6 text-sm ${theme.note}`}
                >
                  Loading expenses...
                </div>
              )}

              {lookupAddress &&
                !lookupLoading &&
                lookupExpenses?.length === 0 && (
                  <div
                    className={`rounded-2xl border px-4 py-6 text-sm ${theme.note}`}
                  >
                    No expenses found for this address.
                  </div>
                )}

              {lookupAddress &&
                !lookupLoading &&
                lookupExpenses &&
                lookupExpenses.length > 0 && (
                  <div className="space-y-3">
                    {lookupExpenses
                      .map((expense, index) => ({
                        expense,
                        index,
                      }))
                      .reverse()
                      .map(({ expense, index }) => (
                        <div
                          key={`${index}-${expense.date.toString()}`}
                          className={`rounded-2xl border px-5 py-4 shadow-sm ${theme.card}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p
                                className={`text-sm font-semibold ${theme.heading}`}
                              >
                                {expense.description}
                              </p>
                              <p className={`mt-1 text-xs ${theme.kicker}`}>
                                {formatDate(expense.date)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p
                                className={`text-sm font-semibold ${theme.heading}`}
                              >
                                {formatAmount(expense.amount)} EUR
                              </p>
                              <p
                                className={`mt-1 text-[10px] uppercase tracking-[0.2em] ${theme.muted}`}
                              >
                                &nbsp;
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
            </div>
          </section>
        </div>
      </div>

      <TransactionOverlay
        isVisible={isPending || isConfirming}
        type={isPending ? 'pending' : 'confirming'}
      />
      <ModalManager />
    </div>
  )
}
