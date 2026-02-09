import { useEffect, useMemo, useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useQueryClient } from '@tanstack/react-query'
import {
  useAccount,
  useChainId,
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
  const chainId = useChainId()
  const queryClient = useQueryClient()
  const { open } = useModalStore()

  const [date, setDate] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [lookupInput, setLookupInput] = useState('')

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
  }, [address, chainId, isConfirmed, open, queryClient])

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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              On-chain expense log
            </p>
            <h1 className="text-3xl font-semibold text-neutral-900 md:text-4xl">
              Expense Noterisation
            </h1>
            <p className="max-w-xl text-sm text-neutral-600">
              Register and check expenses on-chain.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-semibold text-neutral-600">
              Chain {chainId}
            </span>
            <ConnectButton />
          </div>
        </header>

        <section className="mt-6 rounded-3xl border border-black/10 bg-white/70 px-6 py-4 text-xs text-neutral-600">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="font-semibold text-neutral-700">Proxy:</span>{' '}
              {EXPENSE_REGISTRY_ADDRESS ? (
                <a
                  href={`${blockscoutBase}${EXPENSE_REGISTRY_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-amber-700 underline-offset-2 transition hover:underline"
                >
                  {EXPENSE_REGISTRY_ADDRESS}
                </a>
              ) : (
                <span className="font-mono">Not set</span>
              )}
            </div>
            <div>
              <span className="font-semibold text-neutral-700">
                Implementation:
              </span>{' '}
              {EXPENSE_REGISTRY_IMPLEMENTATION_ADDRESS ? (
                <a
                  href={`${blockscoutBase}${EXPENSE_REGISTRY_IMPLEMENTATION_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-amber-700 underline-offset-2 transition hover:underline"
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
          <section className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm backdrop-blur">
            <h2 className="text-lg font-semibold text-neutral-900">
              Register expense
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Store date, amount, and a short description on-chain.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-neutral-400"
                />
              </div>

              <div className="grid gap-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Amount (EUR, integer)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="120"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-neutral-400"
                />
              </div>

              <div className="grid gap-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Lunch with team"
                  className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-neutral-400"
                />
              </div>

              {formError && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {formError}
                </div>
              )}

              {writeError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {writeError.message}
                </div>
              )}

              <button
                type="submit"
                disabled={!isConnected || isPending || isConfirming}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending
                  ? 'Waiting for signature...'
                  : isConfirming
                  ? 'Confirming on-chain...'
                  : 'Save expense'}
              </button>

              {!hasContract && (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-600">
                  Contract address missing. Deploy the contract and set
                  VITE_EXPENSE_REGISTRY_ADDRESS.
                </div>
              )}
            </form>
          </section>

          <section className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  Your past expenses
                </h2>
                <p className="mt-1 text-sm text-neutral-600">
                  Your on-chain history appears here.
                </p>
              </div>
              {isFetching && (
                <span className="text-xs font-semibold text-neutral-500">
                  Updating...
                </span>
              )}
            </div>

            <div className="mt-6 space-y-3">
              {!isConnected && (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-600">
                  Connect a wallet to see your expense list.
                </div>
              )}

              {isConnected && readError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {readError.message}
                </div>
              )}

              {isConnected && isLoading && (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-600">
                  Loading expenses...
                </div>
              )}

              {isConnected && !isLoading && expenses?.length === 0 && (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-600">
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
                        className="rounded-2xl border border-black/5 bg-white px-5 py-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-neutral-900">
                              {expense.description}
                            </p>
                            <p className="mt-1 text-xs text-neutral-500">
                              {formatDate(expense.date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-neutral-900">
                              {formatAmount(expense.amount)} EUR
                            </p>
                            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
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

          <section className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm backdrop-blur">
            <h2 className="text-lg font-semibold text-neutral-900">
              Lookup expenses by address
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Paste any account to view its recorded expenses.
            </p>

            <div className="mt-5 space-y-3">
              <input
                type="text"
                value={lookupInput}
                onChange={(event) => setLookupInput(event.target.value)}
                placeholder="0x..."
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-neutral-400"
              />

              {lookupInput.trim().length > 0 && !lookupAddress && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Enter a valid 0x address to load expenses.
                </div>
              )}

              {lookupReadError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {lookupReadError.message}
                </div>
              )}

              {lookupAddress && lookupLoading && (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-600">
                  Loading expenses...
                </div>
              )}

              {lookupAddress &&
                !lookupLoading &&
                lookupExpenses?.length === 0 && (
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-600">
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
                          className="rounded-2xl border border-black/5 bg-white px-5 py-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-neutral-900">
                                {expense.description}
                              </p>
                              <p className="mt-1 text-xs text-neutral-500">
                                {formatDate(expense.date)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-neutral-900">
                                {formatAmount(expense.amount)} EUR
                              </p>
                              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
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
